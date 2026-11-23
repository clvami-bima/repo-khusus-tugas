import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';
import { badRequest, notFound, orNotFound } from '../errors/AppError';
import { compact, toDate } from '../utils/helpers';

const NOT_FOUND = 'Karyawan tidak ditemukan.';

export interface ListEmployeesQuery {
  search?: string;
  department?: string;
  status?: string;
  page?: number | string;
  limit?: number | string;
}

export interface EmployeeInput {
  employee_code?: string;
  name?: string;
  email?: string;
  position?: string;
  department?: string;
  join_date?: string;
  base_salary?: number | string;
  bank_account?: string;
  status?: string;
}

export async function listEmployees(query: ListEmployeesQuery) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const where: Prisma.EmployeeWhereInput = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { employee_code: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.department) where.department = query.department;
  if (query.status) where.status = query.status;

  const [total, data] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getEmployee(id: number) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { salary_components: { orderBy: [{ type: 'asc' }, { name: 'asc' }] } },
  });
  if (!employee) throw notFound(NOT_FOUND);
  return employee;
}

export async function createEmployee(input: EmployeeInput) {
  const { employee_code, name, email, position, department, join_date, base_salary, bank_account } = input;

  if (!employee_code || !name || !email || !join_date) {
    throw badRequest('Kode karyawan, nama, email, dan tanggal join wajib diisi.');
  }
  if (Number(base_salary) < 0) {
    throw badRequest('Gaji pokok tidak boleh negatif.');
  }

  return prisma.employee.create({
    data: {
      employee_code,
      name,
      email,
      position,
      department,
      join_date: new Date(join_date),
      base_salary: base_salary || 0,
      bank_account,
    },
  });
}

export async function updateEmployee(id: number, input: EmployeeInput) {
  const { name, email, position, department, join_date, base_salary, bank_account, status } = input;

  return orNotFound(
    prisma.employee.update({
      where: { id },
      data: compact({
        name,
        email,
        position,
        department,
        join_date: toDate(join_date),
        base_salary,
        bank_account,
        status,
      }),
    }),
    NOT_FOUND
  );
}

export async function deleteEmployee(id: number) {
  await orNotFound(prisma.employee.delete({ where: { id } }), NOT_FOUND);
}
