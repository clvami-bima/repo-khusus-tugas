import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Membungkus controller async agar error otomatis diteruskan ke errorHandler.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
