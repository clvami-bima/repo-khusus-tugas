import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  res.json(await authService.login(email, password));
}

export function me(req: Request, res: Response) {
  res.json({ user: req.user });
}
