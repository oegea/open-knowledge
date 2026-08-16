import { test, expect } from '@playwright/test';
import { loadState } from './helpers/state';

test.describe('Anonymous study mode', () => {
  test('reads, completes materials, passes the exam and sees completion', async ({ page }) => {
    const { courseId } = loadState();

    // Start from the course detail.
    await page.goto(`/courses/${courseId}`);
    await page.getByRole('link', { name: /Empezar el curso/ }).click();
    await page.waitForURL('**/study/**');

    // Reading experience renders markdown.
    await expect(
      page.getByRole('heading', { name: 'El Sistema Solar', exact: true })
    ).toBeVisible();
    await expect(page.getByText('ocho planetas')).toBeVisible();

    // Moving forward marks the reading as completed, like turning a page.
    await page.getByRole('button', { name: 'Siguiente' }).click();
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

    // First visit: advance past the first material (auto-completes it).
    await page.goto(`/courses/${courseId}/study`);
    await page.waitForURL(`**/study/**`);
    await page.getByRole('button', { name: 'Siguiente' }).click();
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

  test('narrated material: docked mini player and word highlighting in sync', async ({ page }) => {
    const { courseId, audioMaterialId } = loadState();

    await page.goto(`/courses/${courseId}/study/${audioMaterialId}`);
    await expect(page.getByRole('heading', { name: 'Narración: el cielo nocturno' })).toBeVisible();
    // The transcript aligned: narrated words become seekable anchors.
    await expect(page.locator('[data-word][data-narrated]').first()).toBeAttached();

    // Never played: scrolling away is plain reading — no player chrome at all.
    await page.mouse.move(200, 300);
    await page.mouse.wheel(0, 2400);
    await expect(page.getByRole('region', { name: 'Reproduciendo' })).toHaveCount(0);

    // Playing highlights the narrated word and, with the player scrolled
    // away, docks compact controls above the footer.
    await page.evaluate(() => (document.querySelector('audio') as HTMLAudioElement).play());
    const dock = page.getByRole('region', { name: 'Reproduciendo' });
    await expect(dock).toBeVisible();
    await expect(dock.getByText('Narración: el cielo nocturno')).toBeVisible();
    await expect(dock.getByRole('button', { name: 'Pausar' })).toBeVisible();
    await expect(page.locator('[data-word][aria-current="true"]')).toHaveCount(1);

    // Pause and resume from the dock.
    await dock.getByRole('button', { name: 'Pausar' }).click();
    await expect(dock.getByRole('button', { name: 'Reproducir' })).toBeVisible();
    await dock.getByRole('button', { name: 'Reproducir' }).click();
    await expect(dock.getByRole('button', { name: 'Pausar' })).toBeVisible();

    // The manual scroll above switched following off: the dock offers to
    // catch up. Doing so brings the narrated word (and here the player, right
    // above it) back into view, so the dock folds away.
    await dock.getByRole('button', { name: 'Seguir la narración' }).click();
    await expect(page.locator('[data-word][aria-current="true"]')).toBeInViewport();
    await expect(page.getByRole('region', { name: 'Reproduciendo' })).toHaveCount(0);
  });
});
