import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaApi, PASSWORD, watchErrors } from './helpers.js';

test.describe('Đăng ký / Đăng nhập', () => {
  test('bỏ trống và mật khẩu nhập lại không khớp → báo lỗi dưới từng ô', async ({ page }) => {
    await page.goto('/pages/register.html');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await expect(page.locator('.field-error:not(:empty)')).toHaveCount(4);

    await page.getByLabel('Họ và tên').fill('Nguyễn Văn A');
    await expect(page.locator('#fullName-error')).toBeEmpty(); // sửa ô nào thì hết lỗi ô đó
    await page.getByLabel('Email').fill(uniqueEmail('mismatch'));
    await page.getByLabel('Mật khẩu', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Nhập lại mật khẩu').fill('khac12345');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await expect(page.locator('#confirmPassword-error')).toHaveText('Mật khẩu nhập lại không khớp');
  });

  test('đăng ký thành công: về trang chủ, tên chứa HTML hiện dạng chữ, cookie httpOnly', async ({ page, context }) => {
    const problems = watchErrors(page);
    const name = 'Trần <img src=x onerror=alert(1)>';
    await page.goto('/pages/register.html');
    await page.getByLabel('Họ và tên').fill(name);
    await page.getByLabel('Email').fill(uniqueEmail('reg'));
    await page.getByLabel('Mật khẩu', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Nhập lại mật khẩu').fill(PASSWORD);
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.locator('.navbar__greeting')).toHaveText(name);
    await expect(page.locator('#navbar img')).toHaveCount(0);
    await expect(page.locator('.toast')).toContainText('Tạo tài khoản thành công');

    const token = (await context.cookies()).find((c) => c.name === 'token');
    expect(token.httpOnly).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain('token');
    expect(problems).toEqual([]);
  });

  test('đã đăng nhập mở trang Đăng nhập → tự chuyển về trang chủ; đăng xuất', async ({ page }) => {
    await registerViaApi(page, 'guestonly');
    await page.goto('/pages/login.html');
    await expect(page).toHaveURL('/');
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page.locator('.toast')).toHaveText('Đã đăng xuất');
    await expect(page.getByRole('link', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('sai mật khẩu → báo lỗi và xóa ô mật khẩu', async ({ page, browser }) => {
    const other = await browser.newContext();
    const email = await registerViaApi(await other.newPage(), 'wrongpw');
    await other.close();

    await page.goto('/pages/login.html');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('saimatkhau1');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.locator('.form-alert')).toHaveText('Email hoặc mật khẩu không đúng');
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('');
  });

  test('?redirect hợp lệ → quay về đúng trang; redirect sang trang lạ bị chặn', async ({ page, browser }) => {
    const other = await browser.newContext();
    const email = await registerViaApi(await other.newPage(), 'redirect');
    await other.close();

    const login = async (redirect) => {
      await page.goto(`/pages/login.html?redirect=${encodeURIComponent(redirect)}`);
      await page.getByLabel('Email').fill(email.toUpperCase());
      await page.getByLabel('Mật khẩu', { exact: true }).fill(PASSWORD);
      await page.getByRole('button', { name: 'Đăng nhập' }).click();
    };

    await login('/index.html?from=cart');
    await expect(page).toHaveURL('/index.html?from=cart');
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page.getByRole('link', { name: 'Đăng nhập' })).toBeVisible();

    await login('//evil.example.com');
    await expect(page).toHaveURL('/');
  });
});
