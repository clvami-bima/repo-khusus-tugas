import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(env.port, () => {
  console.log(`Payroll API berjalan di http://localhost:${env.port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
