import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import attendanceRoutes from './routes/attendance.routes';
import authRoutes from './routes/auth.routes';
import contractRoutes from './routes/contract.routes';
import departmentRoutes from './routes/department.routes';
import employeeRoutes from './routes/employee.routes';
import hrRoutes from './routes/hr.routes';
import leaveRoutes from './routes/leave.routes';
import payrollRoutes from './routes/payroll.routes';
import positionRoutes from './routes/position.routes';
import reportRoutes from './routes/report.routes';
import salaryComponentRoutes from './routes/salaryComponent.routes';

const app = express();

// CORS dibatasi ke origin frontend yang dikonfigurasi -- bukan wildcard,
// karena aplikasi ini menangani data gaji yang sensitif.
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/salary-components', salaryComponentRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});
app.use(errorHandler);

export default app;
