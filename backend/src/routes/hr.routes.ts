import { Router } from 'express';
import * as dept from '../controllers/department.controller';
import * as hr from '../controllers/hr.controller';
import * as pos from '../controllers/position.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

// Departemen (daftar menyertakan jumlah karyawan)
router.get('/departments', h(dept.listDepartmentsWithCount));
router.post('/departments', requireRole('admin'), h(dept.createDepartment));
router.put('/departments/:id', requireRole('admin'), h(dept.updateDepartment));
router.delete('/departments/:id', requireRole('admin'), h(dept.deleteDepartment));

// Jabatan (daftar menyertakan jumlah karyawan)
router.get('/positions', h(pos.listPositionsWithCount));
router.post('/positions', requireRole('admin'), h(pos.createPosition));
router.put('/positions/:id', requireRole('admin'), h(pos.updatePosition));
router.delete('/positions/:id', requireRole('admin'), h(pos.deletePosition));

// Detail HR karyawan
router.get('/employees/:id', h(hr.getEmployeeHR));

// Kontrak kerja
router.get('/employees/:id/contracts', h(hr.listContracts));
router.post('/employees/:id/contracts', h(hr.createContract));
router.put('/employees/:id/contracts/:contractId', h(hr.updateContract));

// Riwayat pekerjaan
router.get('/employees/:id/history', h(hr.listEmploymentHistory));
router.post('/employees/:id/history', h(hr.createEmploymentHistory));

export default router;
