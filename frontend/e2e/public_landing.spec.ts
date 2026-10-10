import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Public landing', () => {
  test('renders NY home with pathways and passes axe', async ({ page }) => {
    await page.goto('/ny');
    await expect(page.getByRole('heading', { name: /Build the one-water workforce/i })).toBeVisible();
    await expect(page.getByText('Start a Career')).toBeVisible();
    await expect(page.getByText('Hire Talent')).toBeVisible();
    await expect(page.getByText('Educate & Train')).toBeVisible();
    await expect(page.getByText('Be an Ambassador')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('career pathway has back link', async ({ page }) => {
    await page.goto('/ny/career');
    await expect(page.getByRole('link', { name: /Back to NY home/i })).toBeVisible();
  });

  for (const state of ['nj', 'ct', 'ne'] as const) {
    test(`inactive scaffold /${state} redirects to NY flagship`, async ({ page }) => {
      await page.goto(`/${state}`);
      await expect(page).toHaveURL(/\/ny\/?$/);
      // Live public site remains NYSAWWA / NY
      await expect(page.locator('footer')).toContainText(/NYSAWWA|One Water Workforce/);
    });
  }
});
