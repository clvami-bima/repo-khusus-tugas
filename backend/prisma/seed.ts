import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const employees = [
  { employee_code: 'EMP001', name: 'Siti Aminah', email: 'siti@company.com', position: 'Staff Finance', department: 'Finance', join_date: '2022-01-10', base_salary: 6500000 },
  { employee_code: 'EMP002', name: 'Budi Santoso', email: 'budi@company.com', position: 'Software Engineer', department: 'IT', join_date: '2021-06-01', base_salary: 9500000 },
  { employee_code: 'EMP003', name: 'Rina Kartika', email: 'rina@company.com', position: 'HR Officer', department: 'HR', join_date: '2023-03-15', base_salary: 6000000 },
];

async function main() {
  await prisma.$transaction(async (tx) => {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await tx.user.upsert({
      where: { email: 'admin@company.com' },
      update: {},
      create: { name: 'Admin Payroll', email: 'admin@company.com', password_hash: passwordHash, role: 'admin' },
    });

    for (const { join_date, ...emp } of employees) {
      const exists = await tx.employee.findUnique({ where: { employee_code: emp.employee_code } });
      if (exists) continue; // idempoten: data yang sudah ada tidak diubah

      const created = await tx.employee.create({ data: { ...emp, join_date: new Date(join_date) } });
      await tx.salaryComponent.createMany({
        data: [
          { employee_id: created.id, type: 'allowance', name: 'Tunjangan Transport', amount: 500000, is_percentage: false },
          { employee_id: created.id, type: 'allowance', name: 'Tunjangan Makan', amount: 400000, is_percentage: false },
          { employee_id: created.id, type: 'deduction', name: 'BPJS Kesehatan', amount: 1, is_percentage: true },
          { employee_id: created.id, type: 'deduction', name: 'BPJS Ketenagakerjaan', amount: 2, is_percentage: true },
        ],
      });
    }
  });

  console.log('Seed data berhasil ditambahkan (login: admin@company.com / admin123)');
}

main()
  .catch((err) => {
    console.error('Seed gagal:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
