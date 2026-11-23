import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';

// Middleware wajib login: cek Bearer token di header Authorization.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Token tidak ditemukan. Silakan login.' });
    return;
  }

  try {
    req.user = verifyToken(token); // { id, email, role }
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

// Middleware role-based access (contoh: hanya admin boleh hapus data)
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Anda tidak punya akses untuk aksi ini.' });
      return;
    }
    next();
  };
}
