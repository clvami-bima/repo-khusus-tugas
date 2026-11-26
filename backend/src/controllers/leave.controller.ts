import type { Request, Response } from 'express';
import * as service from '../services/leave.service';
import { idParam, str } from '../utils/helpers';

export async function listLeaveRequests(req: Request, res: Response) {
  res.json(await service.listLeaveRequests({ employeeId: str(req.query.employeeId), status: str(req.query.status) }));
}

export async function getLeaveRequest(req: Request, res: Response) {
  res.json(await service.getLeaveRequest(idParam(req.params.id)));
}

export async function createLeaveRequest(req: Request, res: Response) {
  res.status(201).json(await service.createLeaveRequest(req.body ?? {}));
}

export async function approveLeaveRequest(req: Request, res: Response) {
  res.json(await service.approveLeaveRequest(idParam(req.params.id), req.user?.id ?? null));
}

export async function rejectLeaveRequest(req: Request, res: Response) {
  res.json(await service.rejectLeaveRequest(idParam(req.params.id), req.body?.rejection_reason));
}

export async function cancelLeaveRequest(req: Request, res: Response) {
  res.json(await service.cancelLeaveRequest(idParam(req.params.id)));
}

export async function getLeaveBalance(req: Request, res: Response) {
  const year = Number(req.query.year) || undefined;
  res.json(await service.getLeaveBalance(idParam(req.params.employeeId), year));
}

export async function getLeaveHistory(req: Request, res: Response) {
  res.json(await service.getLeaveHistory(idParam(req.params.employeeId)));
}
