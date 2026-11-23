import type { Request, Response } from 'express';
import * as service from '../services/attendance.service';
import { idParam, str } from '../utils/helpers';

export async function listAttendance(req: Request, res: Response) {
  const { employee_id, date, start_date, end_date, status } = req.query;
  res.json(
    await service.listAttendance({
      employee_id: str(employee_id),
      date: str(date),
      start_date: str(start_date),
      end_date: str(end_date),
      status: str(status),
    })
  );
}

export async function attendanceSummary(req: Request, res: Response) {
  const { employee_id, start_date, end_date } = req.query;
  res.json(
    await service.attendanceSummary({
      employee_id: str(employee_id),
      start_date: str(start_date),
      end_date: str(end_date),
    })
  );
}

export async function getAttendance(req: Request, res: Response) {
  res.json(await service.getAttendance(idParam(req.params.id)));
}

export async function checkIn(req: Request, res: Response) {
  res.status(201).json(await service.checkIn(req.body ?? {}));
}

export async function checkOut(req: Request, res: Response) {
  res.json(await service.checkOut(idParam(req.params.id), req.body?.check_out));
}

export async function createAttendance(req: Request, res: Response) {
  res.status(201).json(await service.createAttendance(req.body ?? {}));
}

export async function updateAttendance(req: Request, res: Response) {
  res.json(await service.updateAttendance(idParam(req.params.id), req.body ?? {}));
}

export async function deleteAttendance(req: Request, res: Response) {
  await service.deleteAttendance(idParam(req.params.id));
  res.status(204).send();
}
