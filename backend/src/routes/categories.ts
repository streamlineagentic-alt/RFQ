import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Public: list categories (needed for RFQ form)
router.get('/', authMiddleware, categoryController.getCategories);

// Admin only: create / delete
router.post('/', authMiddleware, requireRole('admin'), categoryController.createCategory);
router.delete('/:id', authMiddleware, requireRole('admin'), categoryController.deleteCategory);

export default router;
