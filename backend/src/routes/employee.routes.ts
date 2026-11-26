import { Router } from 'express';
import * as c from '../controllers/employee.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth); // semua endpoint karyawan wajib login

router.get('/', h(c.listEmployees));
router.get('/:id', h(c.getEmployee));
router.post('/', h(c.createEmployee));
router.put('/:id', h(c.updateEmployee));
router.delete('/:id', requireRole('admin'), h(c.deleteEmployee)); // hanya admin boleh hapus

export default router;
