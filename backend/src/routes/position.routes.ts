import { Router } from 'express';
import * as c from '../controllers/position.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', h(c.listPositions));
router.get('/:id', h(c.getPosition));
router.post('/', h(c.createPosition));
router.put('/:id', h(c.updatePosition));
router.delete('/:id', requireRole('admin'), h(c.deletePosition));

export default router;
