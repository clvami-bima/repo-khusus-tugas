import { badRequest } from '../errors/AppError';

// Menghapus properti undefined/null -- meniru perilaku COALESCE($n, kolom)
// pada versi SQL sebelumnya: field yang tidak dikirim tidak mengubah data.
export function compact<T extends Record<string, unknown>>(obj: T): { [K in keyof T]?: Exclude<T[K], null> } {
  const out: { [K in keyof T]?: Exclude<T[K], null> } = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const value = obj[key];
    if (value !== undefined && value !== null) out[key] = value as Exclude<T[typeof key], null>;
  }
  return out;
}

export function toDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return new Date(value as string);
}

// id dari URL harus angka bulat; selain itu ditolak dengan 400.
export function idParam(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id)) throw badRequest('ID tidak valid.');
  return id;
}

export function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
