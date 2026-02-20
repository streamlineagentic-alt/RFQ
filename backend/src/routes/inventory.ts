import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/filters', inventoryController.getInventoryFilters);
router.get('/', inventoryController.getInventory);
router.get('/:id', inventoryController.getInventoryItem);

export default router;
