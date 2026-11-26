import type { Request, Response } from 'express';
import * as service from '../services/payroll.service';
import { idParam } from '../utils/helpers';

export async function createPeriod(req: Request, res: Response) {
  const { month, year } = req.body ?? {};
  const { created, period } = await service.createPeriod(Number(month), Number(year));
  res.status(created ? 201 : 200).json(period);
}

export async function listPeriods(_req: Request, res: Response) {
  res.json(await service.listPeriods());
}

export async function runPayroll(req: Request, res: Response) {
  res.json(await service.runPayroll(idParam(req.params.periodId)));
}

export async function listPayrollRuns(req: Request, res: Response) {
  res.json(await service.listPayrollRuns(idParam(req.params.periodId)));
}

export async function downloadPayslip(req: Request, res: Response) {
  await service.sendPayslip(idParam(req.params.runId), res);
}
