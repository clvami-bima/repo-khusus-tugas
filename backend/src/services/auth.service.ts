import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { badRequest, unauthorized } from '../errors/AppError';
import { signToken } from '../utils/jwt';

export async function login(email?: string, password?: string) {
  if (!email || !password) {
    throw badRequest('Email dan password wajib diisi.');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Pesan generik sengaja disamakan agar tidak membocorkan apakah email terdaftar.
  if (!user) throw unauthorized('Email atau password salah.');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw unauthorized('Email atau password salah.');

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
