import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

// Error handler terpusat. Tidak pernah membocorkan detail internal (stack trace, query)
// ke response client -- hanya dicatat ke console untuk debugging developer.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ message: err.message, ...(err.extra ?? {}) });
    return;
  }

  console.error('[ERROR]', err);

  const code = (err as { code?: string } | undefined)?.code;
  if (code === 'P2002') {
    res.status(409).json({ message: 'Data sudah ada (duplikat).' });
    return;
  }
  if (code === 'P2003') {
    res.status(400).json({ message: 'Referensi data tidak valid.' });
    return;
  }
  if (code === 'P2025') {
    res.status(404).json({ message: 'Data tidak ditemukan.' });
    return;
  }
  if (code === 'P2004') {
    res.status(400).json({ message: 'Data tidak memenuhi aturan basis data.' });
    return;
  }

  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
}
