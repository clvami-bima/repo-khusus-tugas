import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateSalary } from '../src/services/payroll.calc';

describe('calculateSalary', () => {
  it('menghitung tunjangan tetap dan potongan persentase', () => {
    const result = calculateSalary(6500000, [
      { name: 'Tunjangan Transport', type: 'allowance', is_percentage: false, amount: 500000 },
      { name: 'Tunjangan Makan', type: 'allowance', is_percentage: false, amount: 400000 },
      { name: 'BPJS Kesehatan', type: 'deduction', is_percentage: true, amount: 1 },
      { name: 'BPJS Ketenagakerjaan', type: 'deduction', is_percentage: true, amount: 2 },
    ]);

    assert.equal(result.totalAllowance, 900000);
    assert.equal(result.totalDeduction, 195000); // 1% + 2% dari 6.500.000
    assert.equal(result.grossSalary, 7400000);
    assert.equal(result.netSalary, 7205000);
    assert.equal(result.breakdown.length, 4);
    assert.equal(result.breakdown[2].computed_amount, 65000);
  });

  it('tanpa komponen: gaji bersih sama dengan gaji pokok', () => {
    const result = calculateSalary('9500000', []);
    assert.equal(result.grossSalary, 9500000);
    assert.equal(result.netSalary, 9500000);
    assert.deepEqual(result.breakdown, []);
  });

  it('menerima nilai Decimal/string dari Prisma', () => {
    const result = calculateSalary({ toString: () => '1000000.00' }, [
      { name: 'Bonus', type: 'allowance', is_percentage: true, amount: { toString: () => '10.00' } },
    ]);
    assert.equal(result.totalAllowance, 100000);
    assert.equal(result.netSalary, 1100000);
  });

  it('membulatkan komponen persentase ke rupiah terdekat', () => {
    const result = calculateSalary(1000001, [
      { name: 'Potongan', type: 'deduction', is_percentage: true, amount: 1 },
    ]);
    assert.equal(result.totalDeduction, 10000); // 10000.01 dibulatkan
  });
});
