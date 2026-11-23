import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';
import { badRequest, notFound, orNotFound } from '../errors/AppError';
import { compact, toDate } from '../utils/helpers';

const NOT_FOUND = 'Kontrak kerja tidak ditemukan.';
const EMPLOYEE_NOT_FOUND = 'Karyawan tidak ditemukan.';

export interface ContractInput {
  employee_id?: number | string;
  contract_type?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  notes?: string;
}

const withEmployee = { employee: { select: { employee_code: true, name: true } } } as const;

// Meratakan relasi employee agar bentuk JSON sama seperti versi SQL JOIN sebelumnya.
function flatten<T extends { employee: { employee_code: string; name: string } }>(row: T) {
  const { employee, ...rest } = row;
  return { ...rest, employee_code: employee.employee_code, employee_name: employee.name };
}

export async function listContracts(filter: { employee_id?: string; status?: string }) {
  const where: Prisma.EmploymentContractWhereInput = {};
  if (filter.employee_id) where.employee_id = Number(filter.employee_id);
  if (filter.status) where.status = filter.status;

  const rows = await prisma.employmentContract.findMany({
    where,
    include: withEmployee,
    orderBy: { start_date: 'desc' },
  });
  return rows.map(flatten);
}

export async function getContract(id: number) {
  const row = await prisma.employmentContract.findUnique({ where: { id }, include: withEmployee });
  if (!row) throw notFound(NOT_FOUND);
  return flatten(row);
}

export function createContract(input: ContractInput) {
  const { employee_id, contract_type, start_date, end_date, status = 'active', notes } = input;
  if (!employee_id || !contract_type || !start_date) {
    throw badRequest('Karyawan, jenis kontrak, dan tanggal mulai wajib diisi.');
  }
  return prisma.employmentContract.create({
    data: {
      employee_id: Number(employee_id),
      contract_type,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : null,
      status,
      notes: notes || null,
    },
  });
}

function updateData(input: ContractInput) {
  const { contract_type, start_date, end_date, status, notes } = input;
  return compact({
    contract_type,
    start_date: toDate(start_date),
    end_date: toDate(end_date),
    status,
    notes,
  });
}

export function updateContract(id: number, input: ContractInput) {
  return orNotFound(prisma.employmentContract.update({ where: { id }, data: updateData(input) }), NOT_FOUND);
}

export async function deleteContract(id: number) {
  await orNotFound(prisma.employmentContract.delete({ where: { id } }), NOT_FOUND);
}

// ---- Rute bersarang: /api/hr/employees/:id/contracts ----

async function assertEmployeeExists(employeeId: number) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
  if (!employee) throw notFound(EMPLOYEE_NOT_FOUND);
}

export async function listContractsOfEmployee(employeeId: number) {
  await assertEmployeeExists(employeeId);
  return prisma.employmentContract.findMany({
    where: { employee_id: employeeId },
    orderBy: [{ start_date: 'desc' }, { id: 'desc' }],
  });
}

export async function createContractForEmployee(employeeId: number, input: ContractInput) {
  const { contract_type, start_date, end_date, status = 'active', notes } = input;
  if (!contract_type || !start_date) {
    throw badRequest('Jenis kontrak dan tanggal mulai wajib diisi.');
  }
  await assertEmployeeExists(employeeId);
  return prisma.employmentContract.create({
    data: {
      employee_id: employeeId,
      contract_type,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : null,
      status,
      notes: notes || null,
    },
  });
}

export async function updateContractOfEmployee(employeeId: number, contractId: number, input: ContractInput) {
  const result = await prisma.employmentContract.updateMany({
    where: { id: contractId, employee_id: employeeId },
    data: updateData(input),
  });
  if (result.count === 0) throw notFound('Kontrak tidak ditemukan.');
  return prisma.employmentContract.findUniqueOrThrow({ where: { id: contractId } });
}
