const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { kycLimiter } = require('../middleware/rateLimit');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/kyc/start
 * @desc    Start KYC process
 * @access  Private
 */
router.post('/start', kycController.startKYC);

/**
 * @route   POST /api/kyc/:kycId/documents
 * @desc    Upload KYC document
 * @access  Private
 */
router.post('/:kycId/documents', 
  kycLimiter,
  validate(schemas.kycDocument),
  kycController.uploadDocument
);

/**
 * @route   GET /api/kyc/status
 * @desc    Get KYC status
 * @access  Private
 */
router.get('/status', kycController.getKYCStatus);

/**
 * @route   GET /api/kyc/requirements
 * @desc    Get KYC requirements
 * @access  Private
 */
router.get('/requirements', kycController.getKYCRequirements);

/**
 * @route   POST /api/kyc/:kycId/submit
 * @desc    Submit KYC for review
 * @access  Private
 */
router.post('/:kycId/submit', kycController.submitKYC);

module.exports = router;
