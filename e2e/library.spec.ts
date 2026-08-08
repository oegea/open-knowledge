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
  });

  test('news section lists the published post', async ({ page }) => {
    const { newsPostId } = loadState();
    await page.goto('/news');
    await expect(page.getByText('Bienvenida a la librería')).toBeVisible();

    await page.goto(`/news/${newsPostId}`);
    await expect(page.getByRole('heading', { name: 'Bienvenida a la librería' })).toBeVisible();
    await expect(page.getByText('primer curso')).toBeVisible();
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
