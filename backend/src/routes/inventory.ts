import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { csvUpload } from '../controllers/inventoryController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/filters', inventoryController.getInventoryFilters);
router.get('/', inventoryController.getInventory);
router.get('/:id', inventoryController.getInventoryItem);
router.post('/import', requireRole('admin'), csvUpload.single('file'), inventoryController.importInventory);

export default router;
