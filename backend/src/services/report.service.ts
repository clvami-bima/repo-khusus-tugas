import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';
import { PERIOD_STATUS } from './payroll.service';

// Ringkasan dashboard: total karyawan aktif, total gaji dibayar periode terakhir, dsb.
export async function dashboardSummary() {
  const [activeCount, latestPeriod, byDepartment] = await Promise.all([
    prisma.employee.count({ where: { status: 'active' } }),
    prisma.payrollPeriod.findFirst({
      where: { status: PERIOD_STATUS.COMPLETED },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.employee.groupBy({
      by: ['department'],
      where: { status: 'active' },
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  let payrollSummary = { total_gross: 0, total_net: 0, total_deduction: 0, employee_count: 0 };
  if (latestPeriod) {
    const sums = await prisma.payrollRun.aggregate({
      where: { period_id: latestPeriod.id },
      _sum: { gross_salary: true, net_salary: true, total_deduction: true },
      _count: { _all: true },
    });
    payrollSummary = {
      total_gross: Number(sums._sum.gross_salary ?? 0),
      total_net: Number(sums._sum.net_salary ?? 0),
      total_deduction: Number(sums._sum.total_deduction ?? 0),
      employee_count: sums._count._all,
    };
  }

  return {
    total_active_employees: activeCount,
    latest_period: latestPeriod,
    payroll_summary: payrollSummary,
    employees_by_department: byDepartment.map((d) => ({ department: d.department, total: d._count._all })),
  };
}

export interface PayrollReportQuery {
  year?: string;
  month?: string;
  department?: string;
  page?: number | string;
  limit?: number | string;
}

// Laporan histori payroll dengan filter, untuk tabel laporan di frontend.
export async function payrollReport(query: PayrollReportQuery) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;

  const where: Prisma.PayrollRunWhereInput = {
    period: {
      year: query.year ? Number(query.year) : undefined,
      month: query.month ? Number(query.month) : undefined,
    },
    employee: query.department ? { department: query.department } : undefined,
  };

  const [total, rows] = await Promise.all([
    prisma.payrollRun.count({ where }),
    prisma.payrollRun.findMany({
      where,
      select: {
        id: true,
        base_salary: true,
        total_allowance: true,
        total_deduction: true,
        gross_salary: true,
        net_salary: true,
        employee: { select: { name: true, employee_code: true, department: true } },
        period: { select: { month: true, year: true } },
      },
      orderBy: [{ period: { year: 'desc' } }, { period: { month: 'desc' } }, { employee: { name: 'asc' } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: rows.map(({ employee, period, ...run }) => ({
      ...run,
      employee_name: employee.name,
      employee_code: employee.employee_code,
      department: employee.department,
      month: period.month,
      year: period.year,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
