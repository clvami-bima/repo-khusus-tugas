import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateTotalDays } from '../src/services/leave.calc';

describe('calculateTotalDays', () => {
  it('rentang inklusif: 1-3 Des = 3 hari', () => {
    assert.equal(calculateTotalDays('2026-12-01', '2026-12-03'), 3);
  });
  it('satu hari yang sama = 1 hari', () => {
    assert.equal(calculateTotalDays('2026-12-01', '2026-12-01'), 1);
  });
  it('tanggal terbalik menghasilkan nilai <= 0 (ditolak service)', () => {
    assert.ok(calculateTotalDays('2026-12-10', '2026-12-01') <= 0);
  });
});
