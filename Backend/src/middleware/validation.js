const Joi = require('joi');
const logger = require('../config/logger');

/**
 * Generic validation middleware using Joi schemas
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn(`Validation error for ${req.method} ${req.path}:`, errorMessage);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // User registration
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    dateOfBirth: Joi.date().max('now').required(),
    nationality: Joi.string().length(2).required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().length(2).required()
    }).required()
  }),

  // User login
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Transfer creation
  transfer: Joi.object({
    sourceAmount: Joi.number().positive().required(),
    sourceCurrency: Joi.string().length(3).required(),
    destinationCurrency: Joi.string().length(3).required(),
    recipientName: Joi.string().min(2).max(100).required(),
    recipientPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    recipientEmail: Joi.string().email().optional(),
    purpose: Joi.string().valid('family-support', 'education', 'business', 'investment', 'other').required(),
    sourceCountry: Joi.string().length(2).required(),
    destinationCountry: Joi.string().length(2).required()
  }),

  // KYC document upload
  kycDocument: Joi.object({
    documentType: Joi.string().valid('passport', 'aadhaar', 'driving-license', 'address-proof').required(),
    documentNumber: Joi.string().required(),
    expiryDate: Joi.date().min('now').optional(),
    issuingCountry: Joi.string().length(2).required()
  }),

  // Rate alert creation
  rateAlert: Joi.object({
    currencyPair: Joi.string().required(),
    alertType: Joi.string().valid('above', 'below').required(),
    targetRate: Joi.number().positive().required(),
    notificationMethods: Joi.array().items(Joi.string().valid('email', 'sms', 'push')).min(1).required()
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'amount', 'status').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required()
  })
};

module.exports = {
  validate,
  schemas
};
