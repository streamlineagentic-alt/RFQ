import { Router } from 'express';
import { body } from 'express-validator';
import * as rfqController from '../controllers/rfqController';
import { rfqFileUpload } from '../controllers/rfqController';
import * as quoteController from '../controllers/quoteController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// All RFQ routes require authentication
router.use(authMiddleware);

// Validation rules for creating RFQ
const createRfqValidation = [
  body('projectName').trim().notEmpty().isLength({ max: 255 }).withMessage('Project name is required (max 255 chars)'),
  body('deliveryCountry').trim().notEmpty().isLength({ max: 100 }).withMessage('Delivery country is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('categoryId').optional().isInt().withMessage('Category ID must be a number'),
  body('industry').optional().trim().isLength({ max: 100 }),
  body('deliveryCity').optional().trim().isLength({ max: 100 }),
  body('deliveryAddress').optional().trim(),
  body('deliveryWindowStart').optional().isISO8601().withMessage('Invalid date format'),
  body('deliveryWindowEnd').optional().isISO8601().withMessage('Invalid date format'),
  body('specifications').optional().trim(),
  body('quantity').optional().isDecimal().withMessage('Quantity must be a number'),
  body('quantityUom').optional().trim().isLength({ max: 50 }),
  body('responseDeadline').optional().isISO8601().withMessage('Invalid date format'),
  body('metadata').optional().isObject()
];

// Validation rules for updating RFQ
const updateRfqValidation = [
  body('projectName').optional().trim().isLength({ max: 255 }),
  body('status').optional().isIn(['draft', 'open', 'closed', 'awarded', 'cancelled']).withMessage('Invalid status'),
  body('deliveryCountry').optional().trim().isLength({ max: 100 }),
  body('description').optional().trim(),
  body('categoryId').optional().isInt(),
  body('industry').optional().trim().isLength({ max: 100 }),
  body('deliveryCity').optional().trim().isLength({ max: 100 }),
  body('deliveryAddress').optional().trim(),
  body('deliveryWindowStart').optional().isISO8601(),
  body('deliveryWindowEnd').optional().isISO8601(),
  body('specifications').optional().trim(),
  body('quantity').optional().isDecimal(),
  body('quantityUom').optional().trim().isLength({ max: 50 }),
  body('responseDeadline').optional().isISO8601(),
  body('buyerNotes').optional().trim(),
  body('metadata').optional().isObject()
];

// Validation rules for submitting a quote
const submitQuoteValidation = [
  body('supplierName').trim().notEmpty().withMessage('Supplier name is required'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('currency').optional().trim().isLength({ max: 10 }),
  body('leadTimeDays').isInt({ min: 1 }).withMessage('Lead time (days) must be a positive integer'),
  body('validityDays').optional().isInt({ min: 1 }),
  body('notes').optional().trim(),
  body('incoterms').optional().trim(),
  body('paymentTerms').optional().trim(),
  body('warranty').optional().trim()
];

// RFQ Routes
router.post('/', requireRole('buyer', 'admin'), createRfqValidation, rfqController.createRfq);
router.get('/', rfqController.getRfqs);
router.get('/:id', rfqController.getRfqById);
router.patch('/:id', requireRole('buyer', 'admin'), updateRfqValidation, rfqController.updateRfq);
router.post('/:id/publish', requireRole('buyer', 'admin'), rfqController.publishRfq);
router.post('/:id/normalize', requireRole('buyer', 'admin'), rfqController.normalizeRfq);
router.get('/:id/matching-suppliers', requireRole('buyer', 'admin'), rfqController.getMatchingSuppliers);
router.get('/:id/comparison', requireRole('buyer', 'admin'), rfqController.getQuoteComparison);
router.post('/:id/recommendation', requireRole('buyer', 'admin'), rfqController.saveRecommendation);
router.post('/:id/upload', requireRole('buyer', 'admin'), rfqFileUpload.single('file'), rfqController.uploadRfqFile);

// Quote Routes (nested under RFQ)
router.get('/:id/quotes', quoteController.getQuotesForRfq);
router.post('/:id/quotes', submitQuoteValidation, quoteController.submitQuote);
router.patch('/:id/quotes/:quoteId/status', requireRole('buyer', 'admin'), quoteController.updateQuoteStatus);

export default router;
