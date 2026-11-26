import { prisma } from '../config/prisma';
import { badRequest, notFound } from '../errors/AppError';

export interface HistoryInput {
  position_id?: number | string | null;
  department_id?: number | string | null;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

const historyInclude = {
  position_rel: { select: { name: true } },
  department_rel: { select: { name: true } },
} as const;

function flattenHistory<
  T extends { position_rel: { name: string } | null; department_rel: { name: string } | null }
>(row: T) {
  const { position_rel, department_rel, ...rest } = row;
  return { ...rest, position_name: position_rel?.name ?? null, department_name: department_rel?.name ?? null };
}

export async function getEmployeeHR(id: number) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department_rel: { select: { name: true } },
      position_rel: { select: { name: true } },
      contracts: { orderBy: [{ start_date: 'desc' }, { id: 'desc' }] },
      history: { include: historyInclude, orderBy: [{ start_date: 'desc' }, { id: 'desc' }] },
    },
  });
  if (!employee) throw notFound('Karyawan tidak ditemukan.');

  const { department_rel, position_rel, contracts, history, ...base } = employee;
  return {
    ...base,
    department_name: department_rel?.name ?? null,
    position_name: position_rel?.name ?? null,
    contracts,
    employment_history: history.map(flattenHistory),
  };
}

export async function listEmploymentHistory(employeeId: number) {
  const rows = await prisma.employmentHistory.findMany({
    where: { employee_id: employeeId },
    include: historyInclude,
    orderBy: [{ start_date: 'desc' }, { id: 'desc' }],
  });
  return rows.map(flattenHistory);
}

export async function createEmploymentHistory(employeeId: number, input: HistoryInput) {
  const { position_id, department_id, start_date, end_date, notes } = input;
  if (!start_date) throw badRequest('Tanggal mulai wajib diisi.');

  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
  if (!employee) throw notFound('Karyawan tidak ditemukan.');

  return prisma.employmentHistory.create({
    data: {
      employee_id: employeeId,
      position_id: position_id ? Number(position_id) : null,
      department_id: department_id ? Number(department_id) : null,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : null,
      notes: notes || null,
    },
  });
}
