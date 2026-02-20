import { Router } from 'express';
import { body } from 'express-validator';
import * as supplierController from '../controllers/supplierController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// All supplier routes require authentication
router.use(authMiddleware);

// Validation rules for creating/updating supplier
const supplierValidation = [
  body('companyName').trim().notEmpty().isLength({ max: 255 }).withMessage('Company name is required'),
  body('contactName').optional().trim().isLength({ max: 255 }),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('phone').optional().trim().isLength({ max: 50 }),
  body('website').optional().isURL().withMessage('Invalid website URL'),
  body('address').optional().trim(),
  body('country').optional().trim().isLength({ max: 100 }),
  body('categories').optional().isArray(),
  body('regions').optional().isArray(),
  body('certifications').optional().isArray()
];

// Routes
router.get('/', supplierController.getSuppliers);
router.post('/', requireRole('admin', 'supplier'), supplierValidation, supplierController.createSupplier);
router.get('/:id', supplierController.getSupplierById);
router.patch('/:id', requireRole('admin'), supplierValidation, supplierController.updateSupplier);
router.delete('/:id', requireRole('admin'), supplierController.deleteSupplier);

export default router;
