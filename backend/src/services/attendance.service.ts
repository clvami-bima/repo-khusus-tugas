import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';
import { badRequest, conflict, notFound, orNotFound } from '../errors/AppError';
import { compact } from '../utils/helpers';
import { calculateLateMinutes, calculateOvertimeMinutes } from './attendance.calc';

const NOT_FOUND = 'Data absensi tidak ditemukan.';
const DUPLICATE = 'Karyawan sudah memiliki data absensi pada tanggal tersebut.';

export interface AttendanceInput {
  employee_id?: number | string;
  attendance_date?: string;
  check_in?: string;
  check_out?: string;
  status?: string;
  notes?: string;
}

export interface AttendanceFilter {
  employee_id?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

// ---------- Query ----------

const withEmployee = {
  employee: { select: { employee_code: true, name: true, department: true, position: true } },
} as const;

type AttendanceWithEmployee = Prisma.AttendanceGetPayload<{ include: typeof withEmployee }>;

function flatten(row: AttendanceWithEmployee) {
  const { employee, ...rest } = row;
  return {
    ...rest,
    employee_code: employee.employee_code,
    employee_name: employee.name,
    department: employee.department,
    position: employee.position,
  };
}

function buildDateRange(filter: Pick<AttendanceFilter, 'date' | 'start_date' | 'end_date'>) {
  const range: Prisma.DateTimeFilter = {};
  if (filter.date) range.equals = new Date(filter.date);
  if (filter.start_date) range.gte = new Date(filter.start_date);
  if (filter.end_date) range.lte = new Date(filter.end_date);
  return Object.keys(range).length ? range : undefined;
}

export async function listAttendance(filter: AttendanceFilter) {
  const where: Prisma.AttendanceWhereInput = {
    employee_id: filter.employee_id ? Number(filter.employee_id) : undefined,
    attendance_date: buildDateRange(filter),
    status: filter.status || undefined,
  };

  const rows = await prisma.attendance.findMany({
    where,
    include: withEmployee,
    orderBy: [{ attendance_date: 'desc' }, { employee: { name: 'asc' } }],
  });
  return rows.map(flatten);
}

export async function getAttendance(id: number) {
  const row = await prisma.attendance.findUnique({ where: { id }, include: withEmployee });
  if (!row) throw notFound(NOT_FOUND);
  return flatten(row);
}

function isUniqueViolation(err: unknown) {
  return (err as { code?: string }).code === 'P2002';
}

export async function checkIn(input: AttendanceInput & { check_in?: string }) {
  const { employee_id, attendance_date, check_in, notes } = input;
  if (!employee_id || !attendance_date) {
    throw badRequest('employee_id dan attendance_date wajib diisi.');
  }

  const checkInTime = check_in ? new Date(check_in) : new Date();
  const lateMinutes = calculateLateMinutes(checkInTime);

  try {
    return await prisma.attendance.create({
      data: {
        employee_id: Number(employee_id),
        attendance_date: new Date(attendance_date),
        check_in: checkInTime,
        late_minutes: lateMinutes,
        status: lateMinutes > 0 ? 'late' : 'present',
        notes: notes || null,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict(DUPLICATE);
    throw err;
  }
}

export function checkOut(id: number, check_out?: string) {
  const checkOutTime = check_out ? new Date(check_out) : new Date();
  return orNotFound(
    prisma.attendance.update({
      where: { id },
      data: { check_out: checkOutTime, overtime_minutes: calculateOvertimeMinutes(checkOutTime) },
    }),
    NOT_FOUND
  );
}

export async function createAttendance(input: AttendanceInput) {
  const { employee_id, attendance_date, check_in, check_out, status = 'present', notes } = input;
  if (!employee_id || !attendance_date) {
    throw badRequest('employee_id dan attendance_date wajib diisi.');
  }

  const checkInTime = check_in ? new Date(check_in) : null;
  const checkOutTime = check_out ? new Date(check_out) : null;

  try {
    return await prisma.attendance.create({
      data: {
        employee_id: Number(employee_id),
        attendance_date: new Date(attendance_date),
        check_in: checkInTime,
        check_out: checkOutTime,
        late_minutes: calculateLateMinutes(checkInTime),
        overtime_minutes: calculateOvertimeMinutes(checkOutTime),
        status,
        notes: notes || null,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict(DUPLICATE);
    throw err;
  }
}

export function updateAttendance(id: number, input: AttendanceInput) {
  const { check_in, check_out, status, notes } = input;
  const checkInTime = check_in ? new Date(check_in) : null;
  const checkOutTime = check_out ? new Date(check_out) : null;

  // Menit terlambat/lembur dihitung ulang hanya bila jam terkait dikirim.
  return orNotFound(
    prisma.attendance.update({
      where: { id },
      data: compact({
        check_in: checkInTime,
        check_out: checkOutTime,
        late_minutes: checkInTime ? calculateLateMinutes(checkInTime) : null,
        overtime_minutes: checkOutTime ? calculateOvertimeMinutes(checkOutTime) : null,
        status,
        notes,
      }),
    }),
    NOT_FOUND
  );
}

export async function deleteAttendance(id: number) {
  await orNotFound(prisma.attendance.delete({ where: { id } }), NOT_FOUND);
}

export async function attendanceSummary(filter: Pick<AttendanceFilter, 'employee_id' | 'start_date' | 'end_date'>) {
  const where: Prisma.AttendanceWhereInput = {
    employee_id: filter.employee_id ? Number(filter.employee_id) : undefined,
    attendance_date: buildDateRange(filter),
  };

  const [grouped, sums] = await Promise.all([
    prisma.attendance.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.attendance.aggregate({ where, _sum: { late_minutes: true, overtime_minutes: true } }),
  ]);

  const countOf = (status: string) => grouped.find((g) => g.status === status)?._count._all ?? 0;

  return {
    present_days: countOf('present'),
    late_days: countOf('late'),
    absent_days: countOf('absent'),
    leave_days: countOf('leave'),
    sick_days: countOf('sick'),
    total_late_minutes: sums._sum.late_minutes ?? 0,
    total_overtime_minutes: sums._sum.overtime_minutes ?? 0,
  };
}
