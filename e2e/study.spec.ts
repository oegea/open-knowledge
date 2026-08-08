import { test, expect } from '@playwright/test';
import { loadState } from './helpers/state';

test.describe('Anonymous study mode', () => {
  test('reads, completes materials, passes the exam and sees completion', async ({ page }) => {
    const { courseId } = loadState();

    // Start from the course detail.
    await page.goto(`/courses/${courseId}`);
    await page.getByRole('link', { name: /Empezar el curso/ }).click();
    await page.waitForURL(`**/courses/${courseId}/study/**`);

    // Reading experience renders markdown.
    await expect(
      page.getByRole('heading', { name: 'El Sistema Solar', exact: true })
    ).toBeVisible();
    await expect(page.getByText('ocho planetas')).toBeVisible();

    // Mark the reading as completed; it auto-advances to the exam.
    await page.getByRole('button', { name: /Marcar como completado/ }).click();
    await expect(page.getByText('¿Qué planeta está más cerca del Sol?')).toBeVisible();

    // Answer correctly and check the explanatory feedback.
    await page.getByRole('radio', { name: 'Mercurio' }).click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.getByText('¡Correcto!')).toBeVisible();
    await expect(page.getByText('Mercurio orbita a unas 0,39 UA.')).toBeVisible();

    // Finish: passed results and course completion banner with register hint.
    await page.getByRole('button', { name: 'Resultado' }).click();
    await expect(page.getByText('Aprobado')).toBeVisible();
    await expect(page.getByRole('status').getByText('¡Curso completado!')).toBeVisible();
    await expect(page.getByText(/Regístrate para conservar/)).toBeVisible();
  });

  test('progress persists on the device and resumes where you left off', async ({ page }) => {
    const { courseId } = loadState();

    // First visit: complete the first material.
    await page.goto(`/courses/${courseId}/study`);
    await page.waitForURL(`**/study/**`);
    await page.getByRole('button', { name: /Marcar como completado/ }).click();
    await expect(page.getByText('¿Qué planeta está más cerca del Sol?')).toBeVisible();

    // Detail page now offers continuing with visible progress.
    await page.goto(`/courses/${courseId}`);
    await expect(page.getByRole('link', { name: /Continuar el curso/ })).toBeVisible();
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Resuming goes straight to the pending exam material.
    await page.getByRole('link', { name: /Continuar el curso/ }).click();
    await page.waitForURL(`**/study/**`);
    await expect(page.getByText('¿Qué planeta está más cerca del Sol?')).toBeVisible();
  });
});
