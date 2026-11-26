import { Router } from 'express';
import * as c from '../controllers/leave.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', h(c.listLeaveRequests)); // daftar pengajuan cuti
router.get('/:id', h(c.getLeaveRequest)); // detail pengajuan cuti
router.post('/', requireRole('admin', 'hr', 'employee'), h(c.createLeaveRequest));
router.put('/:id/approve', requireRole('admin', 'hr'), h(c.approveLeaveRequest));
router.put('/:id/reject', requireRole('admin', 'hr'), h(c.rejectLeaveRequest));
router.put('/:id/cancel', requireRole('admin', 'hr', 'employee'), h(c.cancelLeaveRequest));
router.get('/:employeeId/balance', h(c.getLeaveBalance)); // sisa cuti
router.get('/:employeeId/history', h(c.getLeaveHistory)); // riwayat cuti

export default router;
