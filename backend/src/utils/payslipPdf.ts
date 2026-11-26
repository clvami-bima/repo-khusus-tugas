import type { Response } from 'express';
import PDFDocument from 'pdfkit';

export interface BreakdownItem {
  name: string;
  type: string;
  is_percentage: boolean;
  amount: number;
  computed_amount: number;
}

export interface PayslipData {
  employee: {
    name: string;
    employee_code: string;
    position: string | null;
    department: string | null;
  };
  period: { month: number; year: number };
  payrollRun: {
    base_salary: unknown;
    gross_salary: unknown;
    total_deduction: unknown;
    net_salary: unknown;
    component_breakdown: BreakdownItem[] | null;
  };
}

export function formatCurrency(value: unknown): string {
  return 'Rp ' + Number(value as number).toLocaleString('id-ID', { minimumFractionDigits: 0 });
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Generate slip gaji PDF dan stream langsung ke response.
export function generatePayslipPdf(res: Response, { employee, period, payrollRun }: PayslipData): void {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=slip-gaji-${employee.employee_code}-${period.month}-${period.year}.pdf`
  );

  doc.pipe(res);

  // Header
  doc.fontSize(18).font('Helvetica-Bold').text('SLIP GAJI', { align: 'center' });
  doc.fontSize(11).font('Helvetica').text(`Periode: ${MONTH_NAMES[period.month - 1]} ${period.year}`, {
    align: 'center',
  });
  doc.moveDown(1.5);

  // Info karyawan
  doc.fontSize(11).font('Helvetica-Bold').text('Informasi Karyawan');
  doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke();
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(10);
  doc.text(`Nama            : ${employee.name}`);
  doc.text(`Kode Karyawan   : ${employee.employee_code}`);
  doc.text(`Jabatan         : ${employee.position || '-'}`);
  doc.text(`Departemen      : ${employee.department || '-'}`);
  doc.moveDown(1);

  // Rincian gaji
  doc.font('Helvetica-Bold').fontSize(11).text('Rincian Gaji');
  doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke();
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(10);
  doc.text(`Gaji Pokok`, 50, doc.y, { continued: true });
  doc.text(formatCurrency(payrollRun.base_salary), { align: 'right' });

  const breakdown: BreakdownItem[] = payrollRun.component_breakdown || [];
  const allowances = breakdown.filter((c: BreakdownItem) => c.type === 'allowance');
  const deductions = breakdown.filter((c: BreakdownItem) => c.type === 'deduction');

  if (allowances.length) {
    doc.moveDown(0.5).font('Helvetica-Bold').text('Tunjangan:');
    doc.font('Helvetica');
    allowances.forEach((a: BreakdownItem) => {
      doc.text(`  ${a.name}`, 50, doc.y, { continued: true });
      doc.text(formatCurrency(a.computed_amount), { align: 'right' });
    });
  }

  if (deductions.length) {
    doc.moveDown(0.5).font('Helvetica-Bold').text('Potongan:');
    doc.font('Helvetica');
    deductions.forEach((d: BreakdownItem) => {
      doc.text(`  ${d.name}`, 50, doc.y, { continued: true });
      doc.text(`- ${formatCurrency(d.computed_amount)}`, { align: 'right' });
    });
  }

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Gaji Kotor (Gross)', 50, doc.y, { continued: true });
  doc.text(formatCurrency(payrollRun.gross_salary), { align: 'right' });

  doc.text('Total Potongan', 50, doc.y, { continued: true });
  doc.text(`- ${formatCurrency(payrollRun.total_deduction)}`, { align: 'right' });

  doc.moveDown(0.3);
  doc.fontSize(13).text('Gaji Bersih (Net)', 50, doc.y, { continued: true });
  doc.text(formatCurrency(payrollRun.net_salary), { align: 'right' });

  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica-Oblique').text(
    'Dokumen ini dibuat otomatis oleh sistem payroll dan sah tanpa tanda tangan basah.',
    { align: 'center' }
  );

  doc.end();
}
