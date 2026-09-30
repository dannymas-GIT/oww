import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Auth local password + OTP', () => {
  test('login page defaults to account password', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Account password/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Email \/ text code/i })).toBeVisible();
    await expect(page.getByLabel(/Email or username/i)).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
