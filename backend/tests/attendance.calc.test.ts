import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateLateMinutes, calculateOvertimeMinutes } from '../src/services/attendance.calc';

// Tanggal dibuat dengan waktu lokal agar tes tidak bergantung zona waktu mesin.
describe('calculateLateMinutes', () => {
  it('tepat 08:00 tidak terlambat', () => {
    assert.equal(calculateLateMinutes(new Date(2026, 10, 2, 8, 0)), 0);
  });
  it('08:30 terlambat 30 menit', () => {
    assert.equal(calculateLateMinutes(new Date(2026, 10, 2, 8, 30)), 30);
  });
  it('sebelum 08:00 tidak terlambat', () => {
    assert.equal(calculateLateMinutes(new Date(2026, 10, 2, 7, 45)), 0);
  });
  it('tanpa jam masuk = 0', () => {
    assert.equal(calculateLateMinutes(null), 0);
  });
});

describe('calculateOvertimeMinutes', () => {
  it('pulang 17:00 tidak lembur', () => {
    assert.equal(calculateOvertimeMinutes(new Date(2026, 10, 2, 17, 0)), 0);
  });
  it('pulang 18:10 lembur 70 menit', () => {
    assert.equal(calculateOvertimeMinutes(new Date(2026, 10, 2, 18, 10)), 70);
  });
  it('tanpa jam pulang = 0', () => {
    assert.equal(calculateOvertimeMinutes(undefined), 0);
  });
});
