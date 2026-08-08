import { test, expect } from '@playwright/test';
import { generate } from 'otplib';
import { loadState } from './helpers/state';

test.describe('Identity and administration', () => {
  test('admin signs in with TOTP and reaches the panel', async ({ page }) => {
    const { adminIdentifier, adminSecret } = loadState();

    await page.goto('/login');
    await page.getByPlaceholder('Erudito#4821').fill(adminIdentifier);
    await page
      .locator('input[inputmode="numeric"]')
      .fill(await generate({ secret: adminSecret }));
    await page.getByRole('button', { name: /Iniciar sesión|Sign in/ }).click();

    await page.waitForURL('**/admin');
    await expect(page.getByRole('link', { name: 'Introducción a la Astronomía' })).toBeVisible();
  });

  test('registration issues an identity with QR and recovery code', async ({ page }) => {
    let secret = '';
    page.on('response', async (response) => {
      if (response.url().endsWith('/api/identity/challenge') && response.ok()) {
        secret = (await response.json()).secret;
      }
    });

    await page.goto('/register');
    await expect(page.locator('img[src^="data:image"]')).toBeVisible();
    // React re-runs the mount effect in dev, issuing two challenges; wait for
    // the network to settle so the captured secret matches the page state.
    await page.waitForLoadState('networkidle');
    await expect.poll(() => secret).not.toBe('');

    await page.locator('input[inputmode="numeric"]').fill(await generate({ secret }));
    await page.getByRole('button', { name: /Crear identidad|Create identity/ }).click();

    // One-time recovery code screen.
    await expect(page.locator('code')).toBeVisible();
  });

  test('the notifications bell shows library activity to signed-in users', async ({ page }) => {
    const { adminIdentifier, adminSecret } = loadState();

    await page.goto('/login');
    await page.getByPlaceholder('Erudito#4821').fill(adminIdentifier);
    await page
      .locator('input[inputmode="numeric"]')
      .fill(await generate({ secret: adminSecret }));
    await page.getByRole('button', { name: /Iniciar sesión|Sign in/ }).click();
    await page.waitForURL('**/admin');

    await page.goto('/');
    await page.getByRole('button', { name: /Notificaciones|Notifications/ }).click();
    await expect(page.getByText(/Nueva noticia: Bienvenida a la librería/)).toBeVisible();
    await expect(page.getByText(/Nuevo curso: Introducción a la Astronomía/)).toBeVisible();
  });
});
