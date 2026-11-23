import type { Request, Response } from 'express';
import * as service from '../services/position.service';
import { idParam } from '../utils/helpers';

export async function listPositions(_req: Request, res: Response) {
  res.json(await service.listPositions());
}

export async function listPositionsWithCount(_req: Request, res: Response) {
  res.json(await service.listPositionsWithCount());
}

export async function getPosition(req: Request, res: Response) {
  res.json(await service.getPosition(idParam(req.params.id)));
}

export async function createPosition(req: Request, res: Response) {
  res.status(201).json(await service.createPosition(req.body ?? {}));
}

export async function updatePosition(req: Request, res: Response) {
  res.json(await service.updatePosition(idParam(req.params.id), req.body ?? {}));
}

export async function deletePosition(req: Request, res: Response) {
  await service.deletePosition(idParam(req.params.id));
  res.status(204).send();
}
