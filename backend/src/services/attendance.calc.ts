// Aturan bisnis absensi -- fungsi murni (tanpa database), mudah dites.


// Jam masuk 08:00 -- selisih menit setelahnya dihitung terlambat.
export function calculateLateMinutes(checkIn: Date | null | undefined): number {
  if (!checkIn) return 0;
  const workStart = new Date(checkIn);
  workStart.setHours(8, 0, 0, 0);
  const diff = Math.floor((checkIn.getTime() - workStart.getTime()) / 60000);
  return Math.max(diff, 0);
}

// Jam pulang 17:00 -- selisih menit setelahnya dihitung lembur.
export function calculateOvertimeMinutes(checkOut: Date | null | undefined): number {
  if (!checkOut) return 0;
  const workEnd = new Date(checkOut);
  workEnd.setHours(17, 0, 0, 0);
  const diff = Math.floor((checkOut.getTime() - workEnd.getTime()) / 60000);
  return Math.max(diff, 0);
}

