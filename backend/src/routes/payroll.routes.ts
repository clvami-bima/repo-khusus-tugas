import { Router } from 'express';
import * as c from '../controllers/payroll.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

router.get('/periods', h(c.listPeriods));
router.post('/periods', requireRole('admin'), h(c.createPeriod));
router.post('/periods/:periodId/run', requireRole('admin'), h(c.runPayroll));
router.get('/periods/:periodId/runs', h(c.listPayrollRuns));
router.get('/runs/:runId/payslip', h(c.downloadPayslip));

export default router;
