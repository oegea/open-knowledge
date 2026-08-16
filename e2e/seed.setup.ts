import { test as setup, expect } from '@playwright/test';
import { generate } from 'otplib';
import { saveState } from './helpers/state';

const COVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#12424a"/><circle cx="1000" cy="200" r="90" fill="#f7c46d"/><circle cx="300" cy="500" r="55" fill="#38bdc2"/></svg>`;

/** PCM WAV of `seconds` of silence (8 kHz, 8-bit, mono): tiny and playable everywhere. */
function silentWav(seconds: number): Buffer {
  const sampleRate = 8000;
  const dataLength = sampleRate * seconds;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate, 28); // byte rate (8-bit mono)
  header.writeUInt16LE(1, 32); // block align
  header.writeUInt16LE(8, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return Buffer.concat([header, Buffer.alloc(dataLength, 128)]);
}

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
      sources: [{ title: 'Archivos públicos de NASA', url: 'https://images.nasa.gov' }],
      license: 'CC BY-SA 4.0',
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

  // Narrated chapter: a short silent WAV plus its timed transcript, so the
  // study view can be exercised with the mini player and word highlighting.
  const audioUpload = await request.post('/api/media', {
    multipart: {
      kind: 'audio',
      file: { name: 'narration.wav', mimeType: 'audio/wav', buffer: silentWav(20) },
    },
  });
  expect(audioUpload.status()).toBe(201);
  const { path: audioPath } = await audioUpload.json();
  const NARRATED = 'El cielo nocturno tiene ocho planetas visibles.';
  const transcript = {
    words: NARRATED.split(' ').map((text, index) => ({
      text,
      start: index * 0.5,
      end: index * 0.5 + 0.4,
    })),
  };
  const transcriptUpload = await request.post('/api/media', {
    multipart: {
      kind: 'transcripts',
      file: {
        name: 'narration.transcript.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(transcript)),
      },
    },
  });
  expect(transcriptUpload.status()).toBe(201);
  const { path: transcriptPath } = await transcriptUpload.json();
  const audioMaterialResponse = await request.post(
    `/api/courses/${courseId}/sections/${sectionId}/materials`,
    {
      data: {
        title: 'Narración: el cielo nocturno',
        type: 'audio',
        markdown: `${NARRATED}\n\nSegundo párrafo, no narrado, para poder hacer scroll.\n\n${'Relleno de lectura. '.repeat(120)}`,
        mediaPath: audioPath,
        transcriptPath,
        required: false,
      },
    }
  );
  expect(audioMaterialResponse.status()).toBe(201);
  const audioMaterialId = (await audioMaterialResponse.json()).course.sections[0].materials[2]
    .id as string;

  const publishResponse = await request.post(`/api/courses/${courseId}/publish`);
  expect(publishResponse.ok()).toBeTruthy();

  // 4. News section enabled + one published post.
  await request.put('/api/settings', {
    data: {
      libraryName: 'Open Knowledge',
      ownerName: 'Equipo E2E',
      logoPath: null,
      heroTitle: '',
      heroText: '',
      registrationOpen: true,
      newsEnabled: true,
    },
  });
  const newsResponse = await request.post('/api/news', {
    data: {
      title: 'Bienvenida a la librería',
      markdown: 'Acabamos de publicar nuestro **primer curso**.',
      author: 'Equipo de la librería',
      published: true,
    },
  });
  expect(newsResponse.status()).toBe(201);
  const newsPostId = (await newsResponse.json()).post.id as string;

  // Managed category matching the course's free-text category, with an image
  // for the landing card.
  const categoryImageResponse = await request.post('/api/media', {
    multipart: {
      kind: 'images',
      file: {
        name: 'category.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from(COVER_SVG),
      },
    },
  });
  expect(categoryImageResponse.status()).toBe(201);
  const { path: categoryImagePath } = await categoryImageResponse.json();

  const categoryResponse = await request.post('/api/categories', {
    data: { name: 'Ciencia', imagePath: categoryImagePath },
  });
  expect(categoryResponse.status()).toBe(201);
  const categoryId = (await categoryResponse.json()).category.id as string;

  saveState({
    adminIdentifier: challenge.identifier,
    adminSecret: challenge.secret,
    courseId,
    audioMaterialId,
    newsPostId,
    categoryId,
  });
});
