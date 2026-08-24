import { test, expect } from '@playwright/test';
import { loadState } from './helpers/state';

test.describe('RSVP reading mode', () => {
  test('reads a text material to the end and moves on to the next one', async ({ page }) => {
    const { courseId } = loadState();

    await page.goto(`/courses/${courseId}/study`);
    await page.waitForURL('**/study/**');

    // The entry point sits by the material meta — clearly visible, never floating.
    await page.getByRole('button', { name: 'Lector RSVP', exact: true }).click();

    const reader = page.getByRole('dialog', { name: 'Lectura rápida (RSVP)' });
    await expect(reader).toBeVisible();
    await expect(reader.getByText('Toca la pantalla para reproducir o pausar')).toBeVisible();

    // Play and let the short seeded material run to the end.
    await reader.getByRole('button', { name: 'Reproducir' }).click();
    await expect(reader.getByText('¡Material completado!')).toBeVisible({ timeout: 20000 });

    // The completion screen invites to the next material.
    await reader.getByRole('button', { name: 'Ir al siguiente material' }).click();
    await expect(page.getByText('¿Qué planeta está más cerca del Sol?')).toBeVisible();
  });

  test('taps toggle playback, settings persist, and exiting returns to the text', async ({
    page,
  }) => {
    const { courseId } = loadState();

    await page.goto(`/courses/${courseId}/study`);
    await page.waitForURL('**/study/**');
    await page.getByRole('button', { name: 'Lector RSVP', exact: true }).click();

    const reader = page.getByRole('dialog', { name: 'Lectura rápida (RSVP)' });
    await expect(reader).toBeVisible();

    // A tap anywhere plays; another tap pauses.
    await reader.click({ position: { x: 40, y: 300 } });
    await expect(reader.getByRole('button', { name: 'Pausar' })).toBeVisible();
    await reader.click({ position: { x: 40, y: 300 } });
    await expect(reader.getByRole('button', { name: 'Reproducir' })).toBeVisible();

    // Speed and sentence pause are chosen from predefined values.
    await reader.getByRole('button', { name: 'Ajustes de lectura' }).click();
    await reader.getByRole('button', { name: '200 ppm', exact: true }).click();
    await reader.getByRole('button', { name: 'Larga', exact: true }).click();
    await expect(reader.getByRole('button', { name: '200 ppm', pressed: true })).toBeVisible();
    await expect(reader.getByRole('button', { name: 'Larga', pressed: true })).toBeVisible();

    // Leaving the reader lands back on the material text.
    await reader.getByRole('button', { name: 'Salir de la lectura rápida' }).click();
    await expect(reader).toBeHidden();
    await expect(page.getByRole('heading', { name: 'El Sistema Solar', exact: true })).toBeVisible();

    // The chosen speed is remembered next time.
    await page.getByRole('button', { name: 'Lector RSVP', exact: true }).click();
    await expect(reader.getByRole('button', { name: '200 ppm', exact: true })).toBeVisible();
  });

  test('bionic reading bolds fixation prefixes and remembers the choice', async ({ page }) => {
    const { courseId } = loadState();

    await page.goto(`/courses/${courseId}/study`);
    await page.waitForURL('**/study/**');

    // Off by default: plain word spans, no fixation bolding.
    const toggle = page.getByRole('button', { name: 'Lectura biónica' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-word] b').first()).toBeHidden();

    // On: every word gets its bold ~40% prefix, e.g. "veci" in "vecindario".
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const vecindario = page
      .locator('[data-word]', { hasText: 'vecindario' })
      .first();
    await expect(vecindario.locator('b')).toHaveText('veci');

    // The device remembers the preference across visits.
    await page.reload();
    await expect(page.getByRole('button', { name: 'Lectura biónica' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.locator('[data-word] b').first()).toBeVisible();
  });

  test('audio with notes offers the reading mode; audio without text does not', async ({
    page,
  }) => {
    const { courseId, audioMaterialId, bareAudioMaterialId } = loadState();

    // Narrated chapter with notes: readable.
    await page.goto(`/courses/${courseId}/study/${audioMaterialId}`);
    await expect(page.locator('audio')).toBeAttached();
    await expect(page.getByRole('button', { name: 'Lector RSVP', exact: true })).toBeVisible();

    // Plain audio with no text: playback only.
    await page.goto(`/courses/${courseId}/study/${bareAudioMaterialId}`);
    await expect(page.locator('audio')).toBeAttached();
    await expect(page.getByRole('button', { name: 'Lector RSVP', exact: true })).toBeHidden();
  });
});
