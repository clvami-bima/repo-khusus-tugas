import { test, expect } from '@playwright/test';
import { createAttendanceRows } from './helpers.js';

async function login(page) {
  await page.goto('http://localhost:5173/login');

  await page
    .getByRole('textbox', { name: 'admin@company.com' })
    .fill('admin@company.com');

  await page
    .getByRole('textbox', { name: '********' })
    .fill('admin123');

  await page
    .getByRole('button', { name: 'Masuk' })
    .click();

  await expect(page).toHaveURL('http://localhost:5173/');
}

test('admin dapat mengedit absensi karyawan', async ({ page, request }) => {
  await createAttendanceRows(request, 1);

  await login(page);

  await page
    .getByRole('link', { name: 'Absensi Karyawan' })
    .click();

  await expect(page).toHaveURL(/attendance/);

  await page
    .getByRole('button', { name: 'Edit' })
    .first()
    .click();

  await page
    .getByRole('combobox')
    .nth(3)
    .selectOption('leave');

  await page
    .getByRole('button', { name: 'Simpan' })
    .click();

  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL(/attendance/);
});