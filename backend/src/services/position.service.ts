import { prisma } from '../config/prisma';
import { badRequest, notFound, orNotFound } from '../errors/AppError';
import { compact } from '../utils/helpers';

const NOT_FOUND = 'Jabatan tidak ditemukan.';

export interface PositionInput {
  name?: string;
  description?: string;
  status?: string;
}

export function listPositions() {
  return prisma.position.findMany({ orderBy: { name: 'asc' } });
}

// Dipakai modul HR: daftar jabatan beserta jumlah karyawannya.
export async function listPositionsWithCount() {
  const rows = await prisma.position.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });
  return rows.map(({ _count, ...p }) => ({ ...p, employee_count: _count.employees }));
}

export async function getPosition(id: number) {
  const row = await prisma.position.findUnique({ where: { id } });
  if (!row) throw notFound(NOT_FOUND);
  return row;
}

export function createPosition({ name, description, status = 'active' }: PositionInput) {
  if (!name || !name.trim()) throw badRequest('Nama jabatan wajib diisi.');
  return prisma.position.create({
    data: { name: name.trim(), description: description || null, status },
  });
}

export function updatePosition(id: number, { name, description, status }: PositionInput) {
  return orNotFound(
    prisma.position.update({ where: { id }, data: compact({ name, description, status }) }),
    NOT_FOUND
  );
}

export async function deletePosition(id: number) {
  await orNotFound(prisma.position.delete({ where: { id } }), NOT_FOUND);
}
