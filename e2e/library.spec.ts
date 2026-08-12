import { test, expect } from '@playwright/test';
import { loadState } from './helpers/state';

test.describe('Public library', () => {
  test('shows the catalog with the published course', async ({ page }) => {
    await page.goto('/courses');

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
    // The manually written byline sits next to the publication date.
    await expect(page.getByText('Por Equipo de la librería')).toBeVisible();

    // The header back button (mobile-only) returns to the news list.
    const newsBack = page.getByRole('link', { name: 'Volver' });
    if (await newsBack.isVisible()) {
      await newsBack.click();
      await expect(page).toHaveURL(/\/news$/);
    }
  });

  test('the catalog navigates up: back button on small screens, breadcrumb on desktop', async ({
    page,
  }) => {
    await page.goto('/courses');
    const back = page.getByRole('link', { name: 'Volver' });
    if (await back.isVisible()) {
      await back.click();
    } else {
      // Desktop hides the back button and shows the breadcrumb trail.
      await page.getByRole('link', { name: 'Librería' }).click();
    }
    await expect(page).toHaveURL(/\/$/);
  });

  test('course detail links back to the catalog and to its category', async ({ page }) => {
    const { courseId } = loadState();
    await page.goto(`/courses/${courseId}`);
    const back = page.getByRole('link', { name: 'Volver' });
    if (await back.isVisible()) {
      await back.click();
    } else {
      await page.getByRole('link', { name: 'Todos los cursos' }).click();
    }
    await expect(page).toHaveURL(/\/courses$/);

    await page.goto(`/courses/${courseId}`);
    await page.getByRole('link', { name: 'Ciencia', exact: true }).click();
    await expect(page).toHaveURL(/\/courses\?category=Ciencia/);
    // The filtered catalog titles itself after the category.
    await expect(page.getByRole('heading', { level: 1, name: 'Ciencia' })).toBeVisible();
  });

  test('navigation marks the current section', async ({ page }) => {
    await page.goto('/courses');

    const menuTrigger = page.getByRole('button', { name: 'Menú' });
    if (await menuTrigger.isVisible()) {
      await menuTrigger.click();
    }
    await expect(page.getByRole('link', { name: 'Cursos' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('footer states the library ownership and engine', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText(/pertenece a Equipo E2E y está impulsada por Open Knowledge/)
    ).toBeVisible();
  });

  test('free-text search filters the catalog', async ({ page }) => {
    await page.goto('/courses?q=Astronomía');
    await expect(page.getByRole('link', { name: /Introducción a la Astronomía/ })).toBeVisible();

    await page.goto('/courses?q=jardinería');
    await expect(page.getByText(/no tiene cursos publicados/)).toBeVisible();
  });

  test('the theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/');

    // On small screens the toggle lives inside the menu sheet.
    const menuTrigger = page.getByRole('button', { name: 'Menú' });
    if (await menuTrigger.isVisible()) {
      await menuTrigger.click();
    }
    const toggle = page.getByRole('button', { name: /tema/i });

    // The browser runs with a light system preference, so the first toggle
    // moves to the opposite: dark.
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
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
    await page.waitForURL('**/study/**');
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
    await expect(
      page.getByRole('link', { name: 'github.com/oegea/open-knowledge' })
    ).toHaveAttribute('href', 'https://github.com/oegea/open-knowledge');
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
