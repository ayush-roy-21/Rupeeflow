const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireKYC } = require('../middleware/auth');
const { transferLimiter } = require('../middleware/rateLimit');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/transfers/quote
 * @desc    Get transfer quote
 * @access  Private
 */
router.post('/quote', 
  transferLimiter,
  validate(schemas.transfer),
  transferController.getTransferQuote
);

/**
 * @route   POST /api/transfers
 * @desc    Create new transfer
 * @access  Private (KYC required)
 */
router.post('/', 
  requireKYC,
  transferLimiter,
  validate(schemas.transfer),
  transferController.createTransfer
);

/**
 * @route   GET /api/transfers
 * @desc    Get user transfers with pagination and filters
 * @access  Private
 */
router.get('/', transferController.getUserTransfers);

/**
 * @route   GET /api/transfers/:transferId
 * @desc    Get transfer by ID
 * @access  Private
 */
router.get('/:transferId', transferController.getTransfer);

/**
 * @route   GET /api/transfers/:transferId/status
 * @desc    Get transfer status
 * @access  Private
 */
router.get('/:transferId/status', transferController.getTransferStatus);

/**
 * @route   DELETE /api/transfers/:transferId
 * @desc    Cancel transfer
 * @access  Private
 */
router.delete('/:transferId', transferController.cancelTransfer);

module.exports = router;
