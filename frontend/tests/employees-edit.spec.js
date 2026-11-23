import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('http://localhost:5173/login');

  await page
    .getByRole('textbox', { name: 'admin@company.com' })
    .fill('admin@company.com');

  await page
    .getByRole('textbox', { name: '********' })
    .fill('admin123');

  await page.getByRole('button', { name: 'Masuk' }).click();

  await expect(page).toHaveURL('http://localhost:5173/');
}

test('admin dapat mengedit karyawan', async ({ page }) => {
  const nama = `Anton Kalasnikov ${Date.now()}`;

  await login(page);

  await page
    .getByRole('link', { name: 'Karyawan', exact: true })
    .click();

  await expect(page).toHaveURL(/employees/);

  await page
    .getByRole('link', { name: 'Kelola' })
    .first()
    .click();

  // Edit data karyawan
  await page.locator('input[name="name"]').fill(nama);
  await page.locator('input[name="department"]').fill('Keuangan Luar Negeri');
  await page.locator('input[name="position"]').fill('Staff Khusus');
  await page.locator('input[name="base_salary"]').fill('42000000.00');
  await page.locator('select[name="status"]').selectOption('active');
  await page.locator('input[name="bank_account"]').fill('32463118912');

  // Simpan
  await page.getByRole('button', { name: 'Simpan' }).click();

  // Verifikasi hasil edit pada baris spesifik (nama unik per run)
  const row = page.getByRole('row', { name: new RegExp(nama) });
  await expect(row).toBeVisible({ timeout: 10000 });
  await expect(row.getByText('Keuangan Luar Negeri')).toBeVisible();
  await expect(row.getByText('Staff Khusus')).toBeVisible();
});