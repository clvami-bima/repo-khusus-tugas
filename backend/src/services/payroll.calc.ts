import type { BreakdownItem } from '../utils/payslipPdf';

export interface SalaryComponentLike {
  name: string;
  type: string;
  is_percentage: boolean;
  amount: number | string | { toString(): string };
}

export interface SalaryCalculation {
  totalAllowance: number;
  totalDeduction: number;
  grossSalary: number;
  netSalary: number;
  breakdown: BreakdownItem[];
}

// Hitung gaji satu karyawan berdasarkan komponen gaji miliknya.
// Fungsi murni (tanpa database) sehingga mudah diuji.
export function calculateSalary(
  baseSalary: number | string | { toString(): string },
  components: SalaryComponentLike[]
): SalaryCalculation {
  let totalAllowance = 0;
  let totalDeduction = 0;
  const breakdown: BreakdownItem[] = [];
  const base = Number(baseSalary.toString());

  for (const c of components) {
    const amount = Number(c.amount.toString());
    const computedAmount = c.is_percentage ? Math.round((amount / 100) * base) : amount;

    if (c.type === 'allowance') totalAllowance += computedAmount;
    else totalDeduction += computedAmount;

    breakdown.push({
      name: c.name,
      type: c.type,
      is_percentage: c.is_percentage,
      amount,
      computed_amount: computedAmount,
    });
  }

  const grossSalary = base + totalAllowance;
  const netSalary = grossSalary - totalDeduction;

  return { totalAllowance, totalDeduction, grossSalary, netSalary, breakdown };
}
