import type { Request, Response } from 'express';
import * as service from '../services/salaryComponent.service';
import { idParam, str } from '../utils/helpers';

export async function listSalaryComponents(req: Request, res: Response) {
  res.json(await service.listSalaryComponents(str(req.query.employeeId) || undefined));
}

export async function getSalaryComponent(req: Request, res: Response) {
  res.json(await service.getSalaryComponent(idParam(req.params.id)));
}

export async function createSalaryComponent(req: Request, res: Response) {
  res.status(201).json(await service.createSalaryComponent(req.body ?? {}));
}

// POST /salary-components/employee/:employeeId -- dipanggil form karyawan di frontend.
export async function createSalaryComponentForEmployee(req: Request, res: Response) {
  const employee_id = idParam(req.params.employeeId);
  res.status(201).json(await service.createSalaryComponent({ ...(req.body ?? {}), employee_id }));
}

export async function updateSalaryComponent(req: Request, res: Response) {
  res.json(await service.updateSalaryComponent(idParam(req.params.id), req.body ?? {}));
}

export async function deleteSalaryComponent(req: Request, res: Response) {
  await service.deleteSalaryComponent(idParam(req.params.id));
  res.status(204).send();
}
