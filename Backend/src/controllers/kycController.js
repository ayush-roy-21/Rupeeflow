const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Start KYC process
 */
const startKYC = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Check if KYC is already in progress
  const existingKYC = await prisma.kycApplication.findFirst({
    where: {
      userId,
      status: { in: ['PENDING', 'IN_REVIEW', 'REQUIRES_ADDITIONAL_INFO'] }
    }
  });

  if (existingKYC) {
    return res.status(400).json({
      success: false,
      message: 'KYC application already in progress',
      code: 'KYC_ALREADY_IN_PROGRESS',
      data: { kycId: existingKYC.id, status: existingKYC.status }
    });
  }

  // Create KYC application
  const kycApplication = await prisma.kycApplication.create({
    data: {
      id: uuidv4(),
      userId,
      status: 'PENDING',
      step: 'DOCUMENT_UPLOAD',
      startedAt: new Date()
    }
  });

  logger.info(`KYC process started for user: ${userId}`);

  res.status(201).json({
    success: true,
    message: 'KYC process started successfully',
    data: {
      kycId: kycApplication.id,
      status: kycApplication.status,
      step: kycApplication.step,
      nextSteps: getNextSteps(kycApplication.step)
    }
  });
});

/**
 * Upload KYC document
 */
const uploadDocument = asyncHandler(async (req, res) => {
  const { kycId } = req.params;
  const { documentType, documentNumber, expiryDate, issuingCountry } = req.body;

  // Validate KYC application
  const kycApplication = await prisma.kycApplication.findFirst({
    where: {
      id: kycId,
      userId: req.user.id,
      status: { in: ['PENDING', 'IN_REVIEW', 'REQUIRES_ADDITIONAL_INFO'] }
    }
  });

  if (!kycApplication) {
    return res.status(404).json({
      success: false,
      message: 'KYC application not found or cannot be modified',
      code: 'KYC_NOT_FOUND'
    });
  }

  // Check if document type is already uploaded
  const existingDocument = await prisma.kycDocument.findFirst({
    where: {
      kycApplicationId: kycId,
      documentType
    }
  });

  if (existingDocument) {
    return res.status(400).json({
      success: false,
      message: 'Document type already uploaded',
      code: 'DOCUMENT_ALREADY_UPLOADED'
    });
  }

  // Create document record
  const document = await prisma.kycDocument.create({
    data: {
      id: uuidv4(),
      kycApplicationId: kycId,
      documentType,
      documentNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      issuingCountry,
      status: 'PENDING_VERIFICATION',
      uploadedAt: new Date()
    }
  });

  // Update KYC application step if needed
  const allRequiredDocuments = await getAllRequiredDocuments(kycApplication.id);
  if (allRequiredDocuments.every(doc => doc.status !== 'PENDING_VERIFICATION')) {
    await prisma.kycApplication.update({
      where: { id: kycId },
      data: { 
        step: 'VERIFICATION_IN_PROGRESS',
        status: 'IN_REVIEW'
      }
    });
  }

  logger.info(`KYC document uploaded: ${document.id} for user: ${req.user.id}`);

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: {
      document: {
        id: document.id,
        documentType: document.documentType,
        status: document.status,
        uploadedAt: document.uploadedAt
      }
    }
  });
});

/**
 * Get KYC status
 */
const getKYCStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const kycApplication = await prisma.kycApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      documents: {
        select: {
          id: true,
          documentType: true,
          status: true,
          uploadedAt: true,
          verifiedAt: true,
          rejectionReason: true
        }
      }
    }
  });

  if (!kycApplication) {
    return res.json({
      success: true,
      data: {
        kycStatus: 'NOT_STARTED',
        step: null,
        documents: [],
        nextSteps: getNextSteps('NOT_STARTED')
      }
    });
  }

  // Calculate completion percentage
  const totalDocuments = kycApplication.documents.length;
  const verifiedDocuments = kycApplication.documents.filter(doc => doc.status === 'VERIFIED').length;
  const completionPercentage = totalDocuments > 0 ? (verifiedDocuments / totalDocuments) * 100 : 0;

  res.json({
    success: true,
    data: {
      kycId: kycApplication.id,
      kycStatus: kycApplication.status,
      step: kycApplication.step,
      completionPercentage,
      documents: kycApplication.documents,
      nextSteps: getNextSteps(kycApplication.step),
      startedAt: kycApplication.startedAt,
      estimatedCompletionTime: kycApplication.estimatedCompletionTime
    }
  });
});

/**
 * Get KYC requirements
 */
const getKYCRequirements = asyncHandler(async (req, res) => {
  const { nationality } = req.user;

  // Define document requirements based on nationality
  const requirements = getDocumentRequirements(nationality);

  res.json({
    success: true,
    data: {
      requirements,
      totalDocuments: requirements.length,
      estimatedProcessingTime: '2-3 business days'
    }
  });
});

/**
 * Submit KYC for review
 */
const submitKYC = asyncHandler(async (req, res) => {
  const { kycId } = req.params;

  // Validate KYC application
  const kycApplication = await prisma.kycApplication.findFirst({
    where: {
      id: kycId,
      userId: req.user.id,
      status: 'PENDING'
    },
    include: {
      documents: true
    }
  });

  if (!kycApplication) {
    return res.status(404).json({
      success: false,
      message: 'KYC application not found or cannot be submitted',
      code: 'KYC_NOT_FOUND'
    });
  }

  // Check if all required documents are uploaded
  const requiredDocuments = getDocumentRequirements(req.user.nationality);
  const uploadedDocuments = kycApplication.documents.map(doc => doc.documentType);
  
  const missingDocuments = requiredDocuments.filter(req => !uploadedDocuments.includes(req.type));
  
  if (missingDocuments.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing required documents',
      code: 'MISSING_DOCUMENTS',
      data: { missingDocuments }
    });
  }

  // Submit for review
  await prisma.kycApplication.update({
    where: { id: kycId },
    data: {
      status: 'IN_REVIEW',
      step: 'VERIFICATION_IN_PROGRESS',
      submittedAt: new Date(),
      estimatedCompletionTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
    }
  });

  // TODO: Send notification to compliance team
  // TODO: Update user KYC status

  logger.info(`KYC submitted for review: ${kycId} by user: ${req.user.id}`);

  res.json({
    success: true,
    message: 'KYC submitted successfully for review',
    data: {
      estimatedCompletionTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    }
  });
});

// Helper functions
function getNextSteps(currentStep) {
  const steps = {
    'NOT_STARTED': ['Start KYC process', 'Upload required documents'],
    'DOCUMENT_UPLOAD': ['Complete document upload', 'Submit for review'],
    'VERIFICATION_IN_PROGRESS': ['Wait for verification', 'Respond to any requests'],
    'REQUIRES_ADDITIONAL_INFO': ['Provide additional information', 'Resubmit documents'],
    'VERIFIED': ['KYC completed', 'Start making transfers']
  };

  return steps[currentStep] || [];
}

function getDocumentRequirements(nationality) {
  const baseRequirements = [
    {
      type: 'passport',
      name: 'Passport',
      required: true,
      description: 'Valid passport with photo and signature',
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      type: 'address-proof',
      name: 'Address Proof',
      required: true,
      description: 'Utility bill, bank statement, or rental agreement',
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    }
  ];

  // Add nationality-specific requirements
  if (nationality === 'IN') {
    baseRequirements.push({
      type: 'aadhaar',
      name: 'Aadhaar Card',
      required: true,
      description: 'Aadhaar card or e-Aadhaar',
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    });
  } else if (nationality === 'RU') {
    baseRequirements.push({
      type: 'driving-license',
      name: 'Driving License',
      required: false,
      description: 'Valid driving license',
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    });
  }

  return baseRequirements;
}

async function getAllRequiredDocuments(kycApplicationId) {
  return await prisma.kycDocument.findMany({
    where: { kycApplicationId }
  });
}

module.exports = {
  startKYC,
  uploadDocument,
  getKYCStatus,
  getKYCRequirements,
  submitKYC
};
