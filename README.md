# Payroll Admin — Fullstack Project

Project referensi untuk role **Fullstack Developer (Mid-level)**: admin panel payroll dengan
backend **Node.js + Express + TypeScript + Prisma (PostgreSQL)** dan frontend **React + Tailwind CSS**.

## Fitur

- **Autentikasi**: login admin dengan JWT, role-based access (admin vs staff).
- **Manajemen Karyawan**: CRUD, pencarian, filter departemen/status, pagination.
- **Komponen Gaji**: tunjangan & potongan per karyawan, nominal tetap atau persentase dari gaji pokok.
- **Proses Payroll**: buat periode (bulan/tahun), jalankan payroll otomatis untuk semua karyawan aktif,
  hasil disimpan sebagai snapshot (tidak berubah walau data karyawan diedit setelahnya).
- **Slip Gaji Digital**: export slip gaji per karyawan ke PDF (pakai `pdfkit`).
- **Dashboard**: ringkasan karyawan aktif, total gaji periode terakhir, grafik karyawan per departemen (recharts).
- **Laporan**: tabel histori payroll dengan filter bulan/tahun/departemen + export CSV.

## Struktur Project

```
payroll-project/
├── backend/                  # Node.js + Express + TypeScript + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma     # definisi model/tabel (sumber kebenaran skema)
│   │   ├── migrations/       # 0_init = baseline skema lengkap
│   │   ├── legacy-sql/       # SQL lama (arsip), digantikan Prisma Migrate
│   │   └── seed.ts           # data contoh
│   ├── src/
│   │   ├── routes/           # URL + middleware (auth, role)
│   │   ├── controllers/      # lapisan HTTP: baca request, panggil service, kirim response
│   │   ├── services/         # LOGIKA BISNIS + akses database lewat Prisma
│   │   ├── middleware/       # auth (JWT/role), errorHandler
│   │   ├── errors/           # AppError (error yang aman dikirim ke client)
│   │   ├── config/           # env.ts, prisma.ts
│   │   └── utils/            # jwt, pdf slip gaji, helper
│   └── tests/                # unit test logika bisnis (node:test)
└── frontend/                 # React + Vite + Tailwind CSS
```

### Arsitektur backend

```
Route  ->  Controller  ->  Service  ->  Prisma  ->  PostgreSQL
(URL)      (HTTP saja)     (aturan      (akses
                            bisnis)      data)
```

Controller tidak menyentuh database; semua aturan bisnis (hitung gaji, hitung keterlambatan,
persetujuan cuti, dst.) berada di `src/services`. Fungsi perhitungan murni dipisah ke berkas
`*.calc.ts` sehingga bisa diuji tanpa database.

## Menjalankan Backend

```bash
cd backend
cp .env.example .env      # isi DATABASE_URL & JWT_SECRET
npm install               # sekaligus membuat Prisma Client
npx prisma migrate deploy # buat tabel di database baru
npm run seed              # (opsional) isi data contoh - login: admin@company.com / admin123
npm run dev               # jalankan di http://localhost:4000
```

Pastikan PostgreSQL sudah berjalan dan database (`payroll_db`) sudah dibuat terlebih dahulu, contoh:
```bash
createdb payroll_db
```

Script lain: `npm run typecheck`, `npm test`, `npm run build` + `npm start` (produksi),
`npm run prisma:studio` (lihat isi database).

### Database yang sudah berjalan (dibuat dengan SQL versi lama)

Jangan jalankan `0_init` ulang. Cukup tandai sebagai sudah diterapkan, lalu normalisasi status periode:

```bash
cd backend
npx prisma migrate resolve --applied 0_init
psql -d payroll_db -c "UPDATE payroll_periods SET status='completed' WHERE status='processed';"
```

Status periode payroll yang sah: `draft`, `processing`, `completed`, `locked`. Setelah payroll
dijalankan, periode berstatus `completed` (sebelumnya kode menulis `processed`, yang ditolak
CHECK constraint database).

### Mengubah skema database

Ubah `prisma/schema.prisma`, lalu `npx prisma migrate dev --name <nama_perubahan>`.
Commit folder `prisma/migrations` yang baru dibuat.

## Menjalankan Frontend

```bash
cd frontend
cp .env.example .env      # sesuaikan VITE_API_URL jika backend tidak di localhost:4000
npm install
npm run dev                 # jalankan di http://localhost:5173
```

## Keamanan yang sudah diterapkan

- Password di-hash dengan `bcryptjs` (tidak pernah disimpan plaintext).
- Autentikasi JWT dengan expiry, disimpan sebagai Bearer token.
- Semua endpoint data karyawan/payroll wajib login (`requireAuth`); hapus data karyawan dibatasi role `admin`.
- Akses database lewat Prisma Client yang selalu memakai query terparameter — **tidak ada string
  concatenation ke SQL**, jadi aman dari SQL injection. Satu-satunya query mentah (`FOR UPDATE`
  pada persetujuan cuti) memakai tagged template yang juga terparameter.
- CORS dibatasi ke origin frontend yang dikonfigurasi, bukan wildcard `*`.
- Validasi input dasar di server (bukan hanya di klien) untuk field wajib dan nilai gaji.
- Pesan error login digeneralisasi ("Email atau password salah") agar tidak membocorkan apakah
  suatu email terdaftar.
- Tidak ada dependency yang mencurigakan — semua package berasal dari npm registry resmi dan populer
  (express, prisma, jsonwebtoken, bcryptjs, pdfkit, react, dsb).

## Rencana Pengembangan Lanjutan (ide next steps)

- Tambah refresh token / logout server-side (blacklist token).
- Tambah audit log untuk setiap perubahan data gaji (siapa mengubah apa, kapan).
- Tambah rate limiting di endpoint login (mis. `express-rate-limit`).
- Tambah role staff dengan akses read-only ke laporan.
- Docker Compose untuk backend + PostgreSQL + frontend (nice-to-have dari JD).
