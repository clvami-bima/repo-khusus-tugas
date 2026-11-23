import { Router } from 'express';
import * as c from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

router.get('/summary', h(c.dashboardSummary));
router.get('/payroll', h(c.payrollReport));

export default router;
