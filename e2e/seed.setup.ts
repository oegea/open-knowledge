import { test as setup, expect } from '@playwright/test';
import { generate } from 'otplib';
import { saveState } from './helpers/state';

const COVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#12424a"/><circle cx="1000" cy="200" r="90" fill="#f7c46d"/><circle cx="300" cy="500" r="55" fill="#38bdc2"/></svg>`;

setup('seed a fresh instance', async ({ request }) => {
  // 1. First registered identity becomes the administrator.
  const challengeResponse = await request.post('/api/identity/challenge');
  expect(challengeResponse.ok()).toBeTruthy();
  const challenge = await challengeResponse.json();
  expect(challenge.willBeAdmin).toBe(true);

  const registerResponse = await request.post('/api/identity/register', {
    data: {
      identifier: challenge.identifier,
      secret: challenge.secret,
      code: await generate({ secret: challenge.secret }),
    },
  });
  expect(registerResponse.status()).toBe(201);

  // 2. Cover image.
  const uploadResponse = await request.post('/api/media', {
    multipart: {
      kind: 'covers',
      file: { name: 'cover.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(COVER_SVG) },
    },
  });
  expect(uploadResponse.status()).toBe(201);
  const { path: coverPath } = await uploadResponse.json();

  // 3. Course with a section, two materials and an exam.
  const courseResponse = await request.post('/api/courses', {
    data: {
      title: 'Introducción a la Astronomía',
      description: 'Un viaje por el cielo nocturno: planetas, estrellas y galaxias.',
      language: 'es',
      category: 'Ciencia',
      coverImage: coverPath,
      authors: ['Equipo E2E'],
      sources: ['Archivos públicos'],
      aiAssisted: true,
    },
  });
  expect(courseResponse.status()).toBe(201);
  const courseId = (await courseResponse.json()).course.id as string;

  const sectionResponse = await request.post(`/api/courses/${courseId}/sections`, {
    data: { title: 'Primeros pasos' },
  });
  const sectionId = (await sectionResponse.json()).course.sections[0].id as string;

  await request.post(`/api/courses/${courseId}/sections/${sectionId}/materials`, {
    data: {
      title: '¿Qué es el Sistema Solar?',
      type: 'markdown',
      markdown: '# El Sistema Solar\n\nNuestro vecindario cósmico tiene **ocho planetas**.',
    },
  });
  await request.post(`/api/courses/${courseId}/sections/${sectionId}/materials`, {
    data: {
      title: 'Examen: el Sistema Solar',
      type: 'exam',
      exam: {
        questions: [
          {
            id: 'q1',
            text: '¿Qué planeta está más cerca del Sol?',
            choices: [
              { id: 'a', text: 'Venus' },
              { id: 'b', text: 'Mercurio' },
            ],
            correctChoiceId: 'b',
            explanation: 'Mercurio orbita a unas 0,39 UA.',
          },
        ],
        passingScore: 0.5,
      },
    },
  });

  const publishResponse = await request.post(`/api/courses/${courseId}/publish`);
  expect(publishResponse.ok()).toBeTruthy();

  // 4. News section enabled + one published post.
  await request.put('/api/settings', {
    data: { libraryName: 'Open Knowledge', registrationOpen: true, newsEnabled: true },
  });
  const newsResponse = await request.post('/api/news', {
    data: {
      title: 'Bienvenida a la librería',
      markdown: 'Acabamos de publicar nuestro **primer curso**.',
      published: true,
    },
  });
  expect(newsResponse.status()).toBe(201);
  const newsPostId = (await newsResponse.json()).post.id as string;

  saveState({
    adminIdentifier: challenge.identifier,
    adminSecret: challenge.secret,
    courseId,
    newsPostId,
  });
});
