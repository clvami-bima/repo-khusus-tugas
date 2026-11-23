import { test, expect } from '@playwright/test';

// Tanggal acak (2027-2029) agar pengajuan antar tes dan antar retry tidak bertabrakan.
function randomLeaveDate() {
  const offset = Math.floor(Math.random() * 1000);
  return new Date(Date.UTC(2027, 0, 1 + offset)).toISOString().slice(0, 10);
}

test.describe('Manajemen Cuti', () => {

  async function login(page) {
    await page.goto('http://localhost:5173/login');

    await page
      .getByRole('textbox', { name: 'admin@company.com' })
      .fill('admin@company.com');

    await page
      .getByRole('textbox', { name: '********' })
      .fill('admin123');

    await page
      .getByRole('textbox', { name: '********' })
      .press('Enter');

    await page.getByRole('link', { name: 'Manajemen Cuti' }).click();

    await expect(
      page.getByRole('button', { name: '+ Ajukan Cuti' })
    ).toBeVisible();
  }

  async function createLeave(page) {
    const leaveDate = randomLeaveDate();

    await page.getByRole('button', { name: '+ Ajukan Cuti' }).click();

    const employeeSelect = page.getByRole('combobox').first();
    const employeeId = await employeeSelect
      .locator('option:not([value=""])')
      .first()
      .getAttribute('value');
    await employeeSelect.selectOption(employeeId);

    await page.getByRole('textbox').first().fill(leaveDate);
    await page.getByRole('textbox').nth(1).fill(leaveDate);

    await page
      .getByRole('combobox')
      .nth(1)
      .selectOption('permission');

    await page
      .getByRole('textbox', { name: 'Masukkan alasan cuti...' })
      .fill('saya ada meeting');

    await page
      .getByRole('button', { name: 'Ajukan Cuti' })
      .click();

    await expect(
      page.getByRole('cell', { name: 'Menunggu' }).last()
    ).toBeVisible();
  }

  test('CREATE - mengajukan cuti', async ({ page }) => {
    await login(page);
    await createLeave(page);
  });

   test('APPROVE - menyetujui pengajuan cuti', async ({ page }) => {
    await login(page);
    await createLeave(page);

    // Approve memakai window.confirm: dialog harus diterima.
    page.once('dialog', dialog => {
      dialog.accept().catch(() => {});
    });

    const [response] = await Promise.all([
      page.waitForResponse(
        r =>
          r.request().method() === 'PUT' &&
          r.url().endsWith('/approve')
      ),
      page.getByRole('button', { name: 'Approve' }).first().click(),
    ]);

    expect(response.status()).toBe(200);
  });

  test('REJECT - menolak pengajuan cuti', async ({ page }) => {
    await login(page);
    await createLeave(page);

    await page.getByRole('cell', { name: 'Menunggu' }).last().click();

    page.once('dialog', dialog => {
      dialog.accept('alasan penolakan untuk testing').catch(() => {});
    });

    await page.getByRole('button', { name: 'Reject' }).last().click();

    await expect(page.getByText('Ditolak').last()).toBeVisible();
  });

  test('CANCEL - membatalkan pengajuan cuti', async ({ page }) => {
    await login(page);
    await createLeave(page);

    await page.getByRole('cell', { name: 'Menunggu' }).last().click();

    page.once('dialog', dialog => {
      dialog.accept().catch(() => {});
    });

    await page.getByRole('button', { name: 'Cancel' }).last().click();

    await expect(page.getByText('Dibatalkan').last()).toBeVisible();
  });

});