import { Router } from 'express';
import * as c from '../controllers/department.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', h(c.listDepartments));
router.get('/:id', h(c.getDepartment));
router.post('/', h(c.createDepartment));
router.put('/:id', h(c.updateDepartment));
router.delete('/:id', requireRole('admin'), h(c.deleteDepartment));

export default router;
