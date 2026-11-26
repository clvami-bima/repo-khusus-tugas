import type { Request, Response } from 'express';
import * as service from '../services/department.service';
import { idParam } from '../utils/helpers';

export async function listDepartments(_req: Request, res: Response) {
  res.json(await service.listDepartments());
}

export async function listDepartmentsWithCount(_req: Request, res: Response) {
  res.json(await service.listDepartmentsWithCount());
}

export async function getDepartment(req: Request, res: Response) {
  res.json(await service.getDepartment(idParam(req.params.id)));
}

export async function createDepartment(req: Request, res: Response) {
  res.status(201).json(await service.createDepartment(req.body ?? {}));
}

export async function updateDepartment(req: Request, res: Response) {
  res.json(await service.updateDepartment(idParam(req.params.id), req.body ?? {}));
}

export async function deleteDepartment(req: Request, res: Response) {
  await service.deleteDepartment(idParam(req.params.id));
  res.status(204).send();
}
