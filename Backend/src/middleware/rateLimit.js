const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redis');
const config = require('../config/environment');
const logger = require('../config/logger');

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW / 1000)
    });
  }
});

/**
 * Stricter rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900 // 15 minutes in seconds
    });
  }
});

/**
 * Rate limiter for transfer creation
 */
const transferLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 transfers per hour
  message: {
    success: false,
    message: 'Transfer limit exceeded, please try again later',
    code: 'TRANSFER_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Transfer rate limit exceeded for user: ${req.user?.id}`);
    res.status(429).json({
      success: false,
      message: 'Transfer limit exceeded, please try again later',
      code: 'TRANSFER_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600 // 1 hour in seconds
    });
  }
});

/**
 * Rate limiter for KYC document uploads
 */
const kycLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 document uploads per day
  message: {
    success: false,
    message: 'KYC document upload limit exceeded, please try again tomorrow',
    code: 'KYC_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`KYC rate limit exceeded for user: ${req.user?.id}`);
    res.status(429).json({
      success: false,
      message: 'KYC document upload limit exceeded, please try again tomorrow',
      code: 'KYC_RATE_LIMIT_EXCEEDED',
      retryAfter: 86400 // 24 hours in seconds
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  transferLimiter,
  kycLimiter
};
