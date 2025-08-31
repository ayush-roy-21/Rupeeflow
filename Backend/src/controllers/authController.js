const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/environment');
const prisma = require('../config/database');
const redisClient = require('../config/redis');
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * User registration
 */
const register = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    nationality,
    address
  } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
      code: 'USER_ALREADY_EXISTS'
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      nationality,
      address: {
        create: address
      },
      kycStatus: 'PENDING',
      role: 'USER',
      isActive: true,
      isEmailVerified: false
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      nationality: true,
      kycStatus: true,
      role: true,
      createdAt: true
    }
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.emailVerification.create({
    data: {
      id: uuidv4(),
      userId: user.id,
      token: verificationToken,
      expiresAt: verificationExpiry
    }
  });

  // TODO: Send verification email
  logger.info(`User registered: ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user,
      requiresEmailVerification: true
    }
  });
});

/**
 * User login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      address: true
    }
  });

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, tokenVersion: user.tokenVersion || 0 },
    config.JWT_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  );

  // Store refresh token in Redis
  await redisClient.setEx(
    `refresh_token:${user.id}`,
    config.JWT_REFRESH_EXPIRES_IN,
    refreshToken
  );

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        nationality: user.nationality,
        kycStatus: user.kycStatus,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        address: user.address
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: config.JWT_EXPIRES_IN
      }
    }
  });
});

/**
 * Refresh access token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required',
      code: 'REFRESH_TOKEN_MISSING'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Check if token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: config.JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      // Remove refresh token from Redis
      await redisClient.del(`refresh_token:${decoded.userId}`);
    } catch (error) {
      // Token might be expired, continue with logout
      logger.warn('Invalid token during logout:', error.message);
    }
  }

  logger.info(`User logged out: ${req.user?.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Verify email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const verification = await prisma.emailVerification.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      isUsed: false
    },
    include: { user: true }
  });

  if (!verification) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token',
      code: 'INVALID_VERIFICATION_TOKEN'
    });
  }

  // Mark email as verified
  await prisma.user.update({
    where: { id: verification.userId },
    data: { isEmailVerified: true }
  });

  // Mark verification token as used
  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { isUsed: true }
  });

  logger.info(`Email verified for user: ${verification.user.email}`);

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

/**
 * Request password reset
 */
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({
    data: {
      id: uuidv4(),
      userId: user.id,
      token: resetToken,
      expiresAt: resetExpiry
    }
  });

  // TODO: Send password reset email
  logger.info(`Password reset requested for user: ${user.email}`);

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
});

/**
 * Reset password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const reset = await prisma.passwordReset.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      isUsed: false
    }
  });

  if (!reset) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
      code: 'INVALID_RESET_TOKEN'
    });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: reset.userId },
    data: { password: hashedPassword }
  });

  // Mark reset token as used
  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { isUsed: true }
  });

  // Invalidate all refresh tokens
  await redisClient.del(`refresh_token:${reset.userId}`);

  logger.info(`Password reset for user ID: ${reset.userId}`);

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword
};
