import type { Response } from 'express';
import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';
import { badRequest, notFound } from '../errors/AppError';
import { generatePayslipPdf, type BreakdownItem } from '../utils/payslipPdf';
import { calculateSalary } from './payroll.calc';

// Status periode payroll -- selaras dengan CHECK constraint di database.
export const PERIOD_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  LOCKED: 'locked',
} as const;

export async function createPeriod(month: number, year: number) {
  if (!month || !year || month < 1 || month > 12) {
    throw badRequest('Bulan (1-12) dan tahun wajib diisi dengan benar.');
  }

  const existing = await prisma.payrollPeriod.findUnique({ where: { month_year: { month, year } } });
  if (existing) return { created: false, period: existing };

  try {
    const period = await prisma.payrollPeriod.create({ data: { month, year } });
    return { created: true, period };
  } catch (err) {
    // Dua request bersamaan: yang kalah balapan mengambil data yang sudah ada.
    if ((err as { code?: string }).code === 'P2002') {
      const period = await prisma.payrollPeriod.findUniqueOrThrow({ where: { month_year: { month, year } } });
      return { created: false, period };
    }
    throw err;
  }
}

export function listPeriods() {
  return prisma.payrollPeriod.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] });
}

// Menjalankan payroll untuk semua karyawan aktif pada periode ini.
// Seluruh proses satu transaksi: gagal di tengah jalan = tidak ada yang tersimpan.
export async function runPayroll(periodId: number) {
  const period = await prisma.payrollPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw notFound('Periode payroll tidak ditemukan.');

  const results = await prisma.$transaction(
    async (tx) => {
      const employees = await tx.employee.findMany({
        where: { status: 'active' },
        include: { salary_components: true },
        orderBy: { id: 'asc' },
      });

      const runs = [];
      for (const emp of employees) {
        const calc = calculateSalary(emp.base_salary, emp.salary_components);
        const values = {
          base_salary: emp.base_salary,
          total_allowance: calc.totalAllowance,
          total_deduction: calc.totalDeduction,
          gross_salary: calc.grossSalary,
          net_salary: calc.netSalary,
          component_breakdown: calc.breakdown as unknown as Prisma.InputJsonValue,
        };

        runs.push(
          await tx.payrollRun.upsert({
            where: { period_id_employee_id: { period_id: periodId, employee_id: emp.id } },
            update: { ...values, generated_at: new Date() },
            create: { period_id: periodId, employee_id: emp.id, ...values },
          })
        );
      }

      await tx.payrollPeriod.update({ where: { id: periodId }, data: { status: PERIOD_STATUS.COMPLETED } });
      return runs;
    },
    { timeout: 30_000 }
  );

  return { message: `Payroll berhasil dijalankan untuk ${results.length} karyawan.`, data: results };
}

export async function listPayrollRuns(periodId: number) {
  const rows = await prisma.payrollRun.findMany({
    where: { period_id: periodId },
    include: { employee: { select: { name: true, employee_code: true, department: true } } },
    orderBy: { employee: { name: 'asc' } },
  });
  return rows.map(({ employee, ...run }) => ({
    ...run,
    employee_name: employee.name,
    employee_code: employee.employee_code,
    department: employee.department,
  }));
}

export async function sendPayslip(runId: number, res: Response) {
  const run = await prisma.payrollRun.findUnique({
    where: { id: runId },
    include: { employee: true, period: true },
  });
  if (!run) throw notFound('Data payroll tidak ditemukan.');

  generatePayslipPdf(res, {
    employee: {
      name: run.employee.name,
      employee_code: run.employee.employee_code,
      position: run.employee.position,
      department: run.employee.department,
    },
    period: { month: run.period.month, year: run.period.year },
    payrollRun: {
      base_salary: run.base_salary,
      gross_salary: run.gross_salary,
      total_deduction: run.total_deduction,
      net_salary: run.net_salary,
      component_breakdown: run.component_breakdown as unknown as BreakdownItem[] | null,
    },
  });
}
