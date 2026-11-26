// Aturan bisnis cuti -- fungsi murni (tanpa database), mudah dites.

// Rentang tanggal inklusif: 1-3 Jan = 3 hari.
export function calculateTotalDays(startDate: string | Date, endDate: string | Date): number {
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}
