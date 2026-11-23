import type { Request, Response } from 'express';
import * as contractService from '../services/contract.service';
import * as hrService from '../services/hr.service';
import { idParam } from '../utils/helpers';

export async function getEmployeeHR(req: Request, res: Response) {
  res.json(await hrService.getEmployeeHR(idParam(req.params.id)));
}

export async function listContracts(req: Request, res: Response) {
  res.json(await contractService.listContractsOfEmployee(idParam(req.params.id)));
}

export async function createContract(req: Request, res: Response) {
  res.status(201).json(await contractService.createContractForEmployee(idParam(req.params.id), req.body ?? {}));
}

export async function updateContract(req: Request, res: Response) {
  res.json(
    await contractService.updateContractOfEmployee(
      idParam(req.params.id),
      idParam(req.params.contractId),
      req.body ?? {}
    )
  );
}

export async function listEmploymentHistory(req: Request, res: Response) {
  res.json(await hrService.listEmploymentHistory(idParam(req.params.id)));
}

export async function createEmploymentHistory(req: Request, res: Response) {
  res.status(201).json(await hrService.createEmploymentHistory(idParam(req.params.id), req.body ?? {}));
}
