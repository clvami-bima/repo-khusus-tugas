import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { asyncHandler as h } from '../utils/asyncHandler';

const router = Router();

router.post('/login', h(auth.login));
router.get('/me', requireAuth, auth.me);

export default router;
