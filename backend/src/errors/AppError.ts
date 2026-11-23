// Error yang aman ditampilkan ke client. Service melempar error ini,
// lalu errorHandler menerjemahkannya menjadi response HTTP.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly extra?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, extra?: Record<string, unknown>) =>
  new AppError(400, message, extra);
export const unauthorized = (message: string) => new AppError(401, message);
export const notFound = (message: string) => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);

// Menjalankan operasi Prisma update/delete dan mengubah error P2025
// (record tidak ada) menjadi 404 dengan pesan khusus modul.
export async function orNotFound<T>(operation: Promise<T>, message: string): Promise<T> {
  try {
    return await operation;
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') throw notFound(message);
    throw err;
  }
}
