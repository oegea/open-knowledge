import { test, expect } from '@playwright/test';
import { loadState } from './helpers/state';

test.describe('Public library', () => {
  test('shows the catalog with the published course', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /Introducción a la Astronomía/ })).toBeVisible();
    await expect(page.getByText('Ciencia').first()).toBeVisible();
  });

  test('course detail shows metadata, AI notice and contents', async ({ page }) => {
    const { courseId } = loadState();
    await page.goto(`/courses/${courseId}`);

    await expect(page.getByRole('heading', { name: 'Introducción a la Astronomía' })).toBeVisible();
    await expect(page.getByRole('note')).toBeVisible(); // AI-assisted notice
    await expect(page.getByText('Primeros pasos')).toBeVisible();
    await expect(page.getByText('¿Qué es el Sistema Solar?')).toBeVisible();
    // The "about" panel states the content license.
    await expect(page.getByText('CC BY-SA 4.0')).toBeVisible();
  });

  test('news section lists the published post', async ({ page }) => {
    const { newsPostId } = loadState();
    await page.goto('/news');
    await expect(page.getByText('Bienvenida a la librería')).toBeVisible();

    await page.goto(`/news/${newsPostId}`);
    await expect(page.getByRole('heading', { name: 'Bienvenida a la librería' })).toBeVisible();
    await expect(page.getByText('primer curso')).toBeVisible();
  });

  test('footer states the library ownership and engine', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText(/pertenece a Equipo E2E y está impulsada por Open Knowledge/)
    ).toBeVisible();
  });

  test('free-text search filters the catalog', async ({ page }) => {
    await page.goto('/?q=Astronomía');
    await expect(page.getByRole('link', { name: /Introducción a la Astronomía/ })).toBeVisible();

    await page.goto('/?q=jardinería');
    await expect(page.getByText(/no tiene cursos publicados/)).toBeVisible();
  });

  test('the theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/');

    // On small screens the toggle lives inside the menu sheet.
    const menuTrigger = page.getByRole('button', { name: 'Menú' });
    if (await menuTrigger.isVisible()) {
      await menuTrigger.click();
    }
    const toggle = page.getByRole('button', { name: /Tema/ });

    await toggle.click(); // auto -> light
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await toggle.click(); // light -> dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('course bibliography renders titled web links', async ({ page }) => {
    const { courseId } = loadState();
    await page.goto(`/courses/${courseId}`);

    const sourceLink = page.getByRole('link', { name: /Archivos públicos de NASA/ });
    await expect(sourceLink).toBeVisible();
    await expect(sourceLink).toHaveAttribute('href', 'https://images.nasa.gov');
  });

  test('materials in the contents are direct links to study mode', async ({ page }) => {
    const { courseId } = loadState();
    await page.goto(`/courses/${courseId}`);

    await page.getByRole('link', { name: /¿Qué es el Sistema Solar\?/ }).click();
    await page.waitForURL(`**/courses/${courseId}/study/**`);
    await expect(
      page.getByRole('heading', { name: 'El Sistema Solar', exact: true })
    ).toBeVisible();
  });

  test('the default about page is seeded in English and linked in the footer', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About this library' }).click();
    await page.waitForURL('**/p/**');

    await expect(page.getByRole('heading', { name: 'About this library' })).toBeVisible();
    await expect(page.getByText(/MIT license/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Oriol Egea' })).toHaveAttribute(
      'href',
      'https://github.com/oegea'
    );
  });

  test('the default welcome course is seeded as an admin-only draft', async ({ request }) => {
    const response = await request.get('/api/courses');
    const { courses } = await response.json();
    // Published catalog does not include the English welcome draft.
    expect(
      courses.some((course: { title: string }) => course.title === 'Creating your first course')
    ).toBe(false);
  });

  test('small screens navigate through the app-like menu sheet', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Menú' });
    test.skip(!(await trigger.isVisible()), 'inline navigation on this viewport');

    await trigger.click();
    await expect(page.getByRole('navigation', { name: 'Menú' })).toBeVisible();
    await page.getByRole('link', { name: 'Iniciar sesión' }).click();
    await page.waitForURL('**/login');
  });

  test('drafts are not exposed to anonymous readers', async ({ request }) => {
    const listResponse = await request.get('/api/courses');
    const { courses } = await listResponse.json();
    expect(courses.every((course: { published: boolean }) => course.published)).toBe(true);

    const createResponse = await request.post('/api/courses', {
      data: { title: 'x', description: 'y', language: 'en' },
    });
    expect(createResponse.status()).toBe(401);
  });
});
