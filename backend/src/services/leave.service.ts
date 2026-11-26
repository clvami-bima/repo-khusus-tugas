import { prisma } from '../config/prisma';
import { badRequest, notFound } from '../errors/AppError';
import { calculateTotalDays } from './leave.calc';

const NOT_FOUND = 'Pengajuan cuti tidak ditemukan.';
const LEAVE_TYPES = ['annual', 'sick', 'permission', 'maternity', 'other'] as const;

export interface LeaveInput {
  employee_id?: number | string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
}

const withEmployee = { employee: { select: { employee_code: true, name: true } } } as const;

function flatten<T extends { employee: { employee_code: string; name: string } }>(row: T) {
  const { employee, ...rest } = row;
  return { ...rest, employee_code: employee.employee_code, employee_name: employee.name };
}

export async function listLeaveRequests(filter: { employeeId?: string; status?: string }) {
  const rows = await prisma.leaveRequest.findMany({
    where: {
      employee_id: filter.employeeId ? Number(filter.employeeId) : undefined,
      status: filter.status || undefined,
    },
    include: withEmployee,
    orderBy: [{ start_date: 'desc' }, { id: 'desc' }],
  });
  return rows.map(flatten);
}

export async function getLeaveRequest(id: number) {
  const row = await prisma.leaveRequest.findUnique({ where: { id }, include: withEmployee });
  if (!row) throw notFound(NOT_FOUND);
  return flatten(row);
}

export async function createLeaveRequest(input: LeaveInput) {
  const { employee_id, leave_type, start_date, end_date, reason } = input;

  if (!employee_id) throw badRequest('Employee wajib dipilih.');
  if (!leave_type || !(LEAVE_TYPES as readonly string[]).includes(leave_type)) {
    throw badRequest('Jenis cuti tidak valid.');
  }
  if (!start_date || !end_date) {
    throw badRequest('Tanggal mulai dan tanggal selesai wajib diisi.');
  }

  const totalDays = calculateTotalDays(start_date, end_date);
  if (totalDays <= 0) throw badRequest('Rentang tanggal cuti tidak valid.');

  const employeeId = Number(employee_id);
  const start = new Date(start_date);
  const end = new Date(end_date);

  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findFirst({
      where: { id: employeeId, status: 'active' },
      select: { id: true },
    });
    if (!employee) throw badRequest('Employee tidak ditemukan atau tidak aktif.');

    const overlapping = await tx.leaveRequest.findFirst({
      where: {
        employee_id: employeeId,
        status: { in: ['pending', 'approved'] },
        start_date: { lte: end },
        end_date: { gte: start },
      },
      select: { id: true },
    });
    if (overlapping) throw badRequest('Tanggal cuti bertabrakan dengan pengajuan cuti lain.');

    return tx.leaveRequest.create({
      data: {
        employee_id: employeeId,
        leave_type,
        start_date: start,
        end_date: end,
        total_days: totalDays,
        reason: reason || null,
      },
    });
  });
}

// Persetujuan cuti: baris dikunci (FOR UPDATE) supaya dua approval bersamaan
// tidak memotong saldo cuti dua kali.
export function approveLeaveRequest(id: number, approverId: number | null) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM leave_requests WHERE id = ${id} FOR UPDATE`;

    const leave = await tx.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw notFound(NOT_FOUND);
    if (leave.status !== 'pending') {
      throw badRequest('Hanya pengajuan pending yang dapat disetujui.');
    }

    if (leave.leave_type === 'annual') {
      const year = leave.start_date.getUTCFullYear();
      const balance = await tx.employeeLeaveBalance.upsert({
        where: { employee_id_year: { employee_id: leave.employee_id, year } },
        update: { updated_at: new Date() },
        create: { employee_id: leave.employee_id, year },
      });

      const remaining = balance.annual_quota - balance.annual_used;
      if (leave.total_days > remaining) {
        throw badRequest('Sisa cuti tahunan tidak mencukupi.', { remaining_days: remaining });
      }

      await tx.employeeLeaveBalance.update({
        where: { employee_id_year: { employee_id: leave.employee_id, year } },
        data: { annual_used: { increment: leave.total_days } },
      });
    }

    return tx.leaveRequest.update({
      where: { id },
      data: { status: 'approved', approved_by: approverId, approved_at: new Date() },
    });
  });
}

// Hanya pengajuan berstatus pending yang boleh ditolak/dibatalkan.
async function transitionPending(
  id: number,
  data: { status: string; rejection_reason?: string | null },
  notFoundMessage: string
) {
  const result = await prisma.leaveRequest.updateMany({
    where: { id, status: 'pending' },
    data,
  });
  if (result.count === 0) throw notFound(notFoundMessage);
  return prisma.leaveRequest.findUniqueOrThrow({ where: { id } });
}

export function rejectLeaveRequest(id: number, rejectionReason?: string) {
  return transitionPending(
    id,
    { status: 'rejected', rejection_reason: rejectionReason || null },
    'Pengajuan cuti tidak ditemukan atau sudah diproses.'
  );
}

export function cancelLeaveRequest(id: number) {
  return transitionPending(
    id,
    { status: 'cancelled' },
    'Pengajuan cuti tidak ditemukan atau tidak dapat dibatalkan.'
  );
}

export async function getLeaveBalance(employeeId: number, year?: number) {
  const targetYear = year || new Date().getFullYear();
  const balance = await prisma.employeeLeaveBalance.upsert({
    where: { employee_id_year: { employee_id: employeeId, year: targetYear } },
    update: { updated_at: new Date() },
    create: { employee_id: employeeId, year: targetYear },
  });

  return {
    id: balance.id,
    employee_id: balance.employee_id,
    year: balance.year,
    annual_quota: balance.annual_quota,
    annual_used: balance.annual_used,
    annual_remaining: balance.annual_quota - balance.annual_used,
  };
}

export async function getLeaveHistory(employeeId: number) {
  const rows = await prisma.leaveRequest.findMany({
    where: { employee_id: employeeId },
    include: withEmployee,
    orderBy: [{ start_date: 'desc' }, { id: 'desc' }],
  });
  return rows.map((row) => {
    const { employee, approved_by, updated_at, ...rest } = row;
    void approved_by;
    void updated_at;
    return { ...rest, employee_code: employee.employee_code, employee_name: employee.name };
  });
}
