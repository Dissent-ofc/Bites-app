import { test, expect } from '@playwright/test';

test.describe('Auth UI', () => {
  test('renders login page and toggles signup fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByPlaceholder('Your full name')).toBeVisible();
    await expect(page.getByPlaceholder('10-digit mobile number')).toBeVisible();
  });

  test('toggles theme button label', async ({ page }) => {
    await page.goto('/login');

    const themeButton = page.getByRole('button', { name: /Switch to (light|dark) mode/i });
    await expect(themeButton).toBeVisible();

    const before = await themeButton.textContent();
    await themeButton.click();
    const after = await themeButton.textContent();

    expect(after).not.toEqual(before);
  });
});
