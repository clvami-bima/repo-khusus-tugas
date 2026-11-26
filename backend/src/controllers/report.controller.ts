import type { Request, Response } from 'express';
import * as service from '../services/report.service';
import { str } from '../utils/helpers';

export async function dashboardSummary(_req: Request, res: Response) {
  res.json(await service.dashboardSummary());
}

export async function payrollReport(req: Request, res: Response) {
  const { year, month, department, page, limit } = req.query;
  res.json(
    await service.payrollReport({
      year: str(year),
      month: str(month),
      department: str(department),
      page: str(page),
      limit: str(limit),
    })
  );
}
