import type { Request, Response } from 'express';
import * as service from '../services/contract.service';
import { idParam, str } from '../utils/helpers';

export async function listContracts(req: Request, res: Response) {
  res.json(
    await service.listContracts({ employee_id: str(req.query.employee_id), status: str(req.query.status) })
  );
}

export async function getContract(req: Request, res: Response) {
  res.json(await service.getContract(idParam(req.params.id)));
}

export async function createContract(req: Request, res: Response) {
  res.status(201).json(await service.createContract(req.body ?? {}));
}

export async function updateContract(req: Request, res: Response) {
  res.json(await service.updateContract(idParam(req.params.id), req.body ?? {}));
}

export async function deleteContract(req: Request, res: Response) {
  await service.deleteContract(idParam(req.params.id));
  res.status(204).send();
}
