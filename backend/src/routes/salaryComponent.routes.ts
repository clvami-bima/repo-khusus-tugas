import { Router } from 'express';
import * as c from '../controllers/salaryComponent.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', h(c.listSalaryComponents));
router.get('/:id', h(c.getSalaryComponent));

router.post('/', requireRole('admin'), h(c.createSalaryComponent));
router.post('/employee/:employeeId', requireRole('admin'), h(c.createSalaryComponentForEmployee));
router.put('/:id', requireRole('admin'), h(c.updateSalaryComponent));
router.delete('/:id', requireRole('admin'), h(c.deleteSalaryComponent));

export default router;
