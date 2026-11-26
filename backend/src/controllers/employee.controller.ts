import type { Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import { idParam } from '../utils/helpers';

export async function listEmployees(req: Request, res: Response) {
  res.json(await employeeService.listEmployees(req.query));
}

export async function getEmployee(req: Request, res: Response) {
  res.json(await employeeService.getEmployee(idParam(req.params.id)));
}

export async function createEmployee(req: Request, res: Response) {
  res.status(201).json(await employeeService.createEmployee(req.body ?? {}));
}

export async function updateEmployee(req: Request, res: Response) {
  res.json(await employeeService.updateEmployee(idParam(req.params.id), req.body ?? {}));
}

export async function deleteEmployee(req: Request, res: Response) {
  await employeeService.deleteEmployee(idParam(req.params.id));
  res.status(204).send();
}
