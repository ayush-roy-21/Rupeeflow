const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', (req, res) => {
  // TODO: Implement profile update
  res.json({
    success: true,
    message: 'Profile update endpoint - to be implemented'
  });
});

/**
 * @route   POST /api/user/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', (req, res) => {
  // TODO: Implement password change
  res.json({
    success: true,
    message: 'Password change endpoint - to be implemented'
  });
});

/**
 * @route   GET /api/user/limits
 * @desc    Get user transfer limits
 * @access  Private
 */
router.get('/limits', (req, res) => {
  // TODO: Implement limits retrieval
  res.json({
    success: true,
    data: {
      limits: {
        daily: 500000, // 5L INR
        monthly: 5000000, // 50L INR
        maxTransfer: 1000000 // 10L INR
      }
    }
  });
});

module.exports = router;
