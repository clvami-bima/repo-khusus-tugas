const API = process.env.API_URL || 'http://localhost:4000';

// Hanya untuk lokal/CI: akun seed dev.
async function apiLogin(request) {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { email: 'admin@company.com', password: 'admin123' },
  });
  if (!res.ok()) {
    throw new Error(`Login API gagal: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return body.token;
}

function randomDate() {
  const offset = Math.floor(Math.random() * 1000);
  return new Date(Date.UTC(2027, 0, 1 + offset)).toISOString().slice(0, 10);
}

// Membuat `count` absensi lewat API dengan tanggal unik per karyawan.
// Kalau tanggal bentrok (409), coba tanggal lain.
export async function createAttendanceRows(request, count = 1) {
  const token = await apiLogin(request);
  const headers = { Authorization: `Bearer ${token}` };

  const empRes = await request.get(`${API}/api/employees`, { headers });
  if (!empRes.ok()) {
    throw new Error(`GET employees gagal: ${empRes.status()}`);
  }
  const employees = (await empRes.json()).data;
  if (!employees || employees.length === 0) {
    throw new Error('Tidak ada karyawan. Jalankan npm run seed.');
  }
  const employeeId = employees[0].id;

  for (let i = 0; i < count; i++) {
    let created = false;

    for (let attempt = 0; attempt < 10 && !created; attempt++) {
      const res = await request.post(`${API}/api/attendance`, {
        headers,
        data: {
          employee_id: employeeId,
          attendance_date: randomDate(),
          status: 'present',
          notes: 'data tes otomatis',
        },
      });

      if (res.status() === 201) {
        created = true;
      } else if (res.status() !== 409) {
        throw new Error(`POST attendance gagal: ${res.status()} ${await res.text()}`);
      }
    }

    if (!created) {
      throw new Error('Gagal membuat absensi: tanggal terus bentrok.');
    }
  }
}