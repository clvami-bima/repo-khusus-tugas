import { Router } from 'express';
import * as c from '../controllers/contract.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', h(c.listContracts));
router.get('/:id', h(c.getContract));
router.post('/', h(c.createContract));
router.put('/:id', h(c.updateContract));
router.delete('/:id', requireRole('admin'), h(c.deleteContract));

export default router;
