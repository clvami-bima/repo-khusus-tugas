import { Router } from 'express';
import * as c from '../controllers/attendance.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', h(c.listAttendance));
router.get('/summary', h(c.attendanceSummary));
router.get('/:id', h(c.getAttendance));
router.post('/check-in', h(c.checkIn));
router.put('/:id/check-out', h(c.checkOut));
router.post('/', h(c.createAttendance));
router.put('/:id', h(c.updateAttendance));
router.delete('/:id', requireRole('admin'), h(c.deleteAttendance));

export default router;
