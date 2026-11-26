import { prisma } from '../config/prisma';
import { badRequest, notFound, orNotFound } from '../errors/AppError';
import { compact } from '../utils/helpers';

const NOT_FOUND = 'Komponen gaji tidak ditemukan.';

export interface SalaryComponentInput {
  employee_id?: number | string;
  type?: string;
  category?: string;
  name?: string;
  amount?: number | string;
  is_percentage?: boolean;
}

const withEmployee = { employee: { select: { employee_code: true, name: true } } } as const;

function flatten<T extends { employee: { employee_code: string; name: string } }>(row: T) {
  const { employee, ...rest } = row;
  return { ...rest, employee_code: employee.employee_code, employee_name: employee.name };
}

export async function listSalaryComponents(employeeId?: string) {
  const rows = await prisma.salaryComponent.findMany({
    where: employeeId ? { employee_id: Number(employeeId) } : undefined,
    include: withEmployee,
    orderBy: [{ employee: { name: 'asc' } }, { category: 'asc' }, { name: 'asc' }],
  });
  return rows.map(flatten);
}

export async function getSalaryComponent(id: number) {
  const row = await prisma.salaryComponent.findUnique({ where: { id }, include: withEmployee });
  if (!row) throw notFound(NOT_FOUND);
  return flatten(row);
}

export function createSalaryComponent(input: SalaryComponentInput) {
  const { employee_id, type, category, name, amount = 0, is_percentage = false } = input;

  if (!employee_id) throw badRequest('Employee wajib dipilih.');
  if (!type || !['allowance', 'deduction'].includes(type)) {
    throw badRequest('Type harus allowance atau deduction.');
  }
  if (!name) throw badRequest('Nama komponen wajib diisi.');
  if (Number(amount) < 0) throw badRequest('Nominal komponen tidak boleh negatif.');

  return prisma.salaryComponent.create({
    data: {
      employee_id: Number(employee_id),
      type,
      category: category || (type === 'deduction' ? 'deduction' : 'allowance'),
      name,
      amount,
      is_percentage,
    },
  });
}

export function updateSalaryComponent(id: number, input: SalaryComponentInput) {
  const { type, category, name, amount, is_percentage } = input;
  return orNotFound(
    prisma.salaryComponent.update({
      where: { id },
      data: compact({ type, category, name, amount, is_percentage }),
    }),
    NOT_FOUND
  );
}

export async function deleteSalaryComponent(id: number) {
  await orNotFound(prisma.salaryComponent.delete({ where: { id } }), NOT_FOUND);
}
