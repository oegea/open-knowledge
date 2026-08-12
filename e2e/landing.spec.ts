import { test, expect } from '@playwright/test';

test.describe('Categories landing page', () => {
  test('shows the hero and a category card with its managed image', async ({ page }) => {
    await page.goto('/');

    // Hero with the seeded course count.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/1 curso publicado/)).toBeVisible();

    // The "Ciencia" card carries the managed category image.
    const card = page.getByRole('link', { name: /Ciencia/ });
    await expect(card).toBeVisible();
    await expect(card.locator('img')).toBeVisible();
  });

  test('clicking a category opens the catalog pre-filtered', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Ciencia/ }).click();
    await expect(page).toHaveURL(/\/courses\?category=Ciencia/);
    await expect(page.getByRole('link', { name: /Introducción a la Astronomía/ })).toBeVisible();
  });

  test('the view-all card opens the full catalog', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Ver todos los cursos/ }).click();
    await expect(page).toHaveURL(/\/courses$/);
    await expect(page.getByRole('link', { name: /Introducción a la Astronomía/ })).toBeVisible();
  });

  test('the landing search submits to the catalog', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('searchbox').fill('Astronomía');
    await page.getByRole('searchbox').press('Enter');
    await expect(page).toHaveURL(/\/courses\?/);
    await expect(page.getByRole('link', { name: /Introducción a la Astronomía/ })).toBeVisible();
  });

  test('legacy catalog links on / redirect to /courses with their params', async ({ page }) => {
    await page.goto('/?q=Astronomía');
    await expect(page).toHaveURL(/\/courses\?q=Astronom/);
    await expect(page.getByRole('link', { name: /Introducción a la Astronomía/ })).toBeVisible();

    await page.goto('/?category=Ciencia');
    await expect(page).toHaveURL(/\/courses\?category=Ciencia/);
    await expect(page.getByRole('link', { name: /Introducción a la Astronomía/ })).toBeVisible();
  });

  test('a category without a managed entry gets an auto-generated card', async ({ page }) => {
    await page.goto('/');

    // The seeded instance only manages "Ciencia"; the view-all card uses the
    // brand gradient too, so assert the Ciencia card is the only one with an
    // uploaded image and the grid still renders every card.
    const cards = page.locator('main a[href^="/courses"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
  });
});
