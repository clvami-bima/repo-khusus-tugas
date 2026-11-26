import { prisma } from '../config/prisma';
import { badRequest, notFound, orNotFound } from '../errors/AppError';
import { compact } from '../utils/helpers';

const NOT_FOUND = 'Departemen tidak ditemukan.';

export interface DepartmentInput {
  name?: string;
  description?: string;
  status?: string;
}

export function listDepartments() {
  return prisma.department.findMany({ orderBy: { name: 'asc' } });
}

// Dipakai modul HR: daftar departemen beserta jumlah karyawannya.
export async function listDepartmentsWithCount() {
  const rows = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });
  return rows.map(({ _count, ...d }) => ({ ...d, employee_count: _count.employees }));
}

export async function getDepartment(id: number) {
  const row = await prisma.department.findUnique({ where: { id } });
  if (!row) throw notFound(NOT_FOUND);
  return row;
}

export function createDepartment({ name, description, status = 'active' }: DepartmentInput) {
  if (!name || !name.trim()) throw badRequest('Nama departemen wajib diisi.');
  return prisma.department.create({
    data: { name: name.trim(), description: description || null, status },
  });
}

export function updateDepartment(id: number, { name, description, status }: DepartmentInput) {
  return orNotFound(
    prisma.department.update({ where: { id }, data: compact({ name, description, status }) }),
    NOT_FOUND
  );
}

export async function deleteDepartment(id: number) {
  await orNotFound(prisma.department.delete({ where: { id } }), NOT_FOUND);
}
