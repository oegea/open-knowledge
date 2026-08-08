import { Course, CoursePrimitive } from '../../domain/Course';
import * as SectionMother from './SectionMother';

export function createPrimitive(overrides: Partial<CoursePrimitive> = {}): CoursePrimitive {
  return {
    id: 'course-1',
    title: 'Introduction to Astronomy',
    description: 'A journey through the night sky, from planets to galaxies.',
    language: 'en',
    category: 'Science',
    coverImage: '/media/covers/astronomy.jpg',
    authors: ['Carl S.'],
    sources: ['NASA public archives'],
    aiAssisted: false,
    published: false,
    sections: [SectionMother.createPrimitive()],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  };
}

export function create(overrides: Partial<CoursePrimitive> = {}): Course {
  return Course.fromPrimitive(createPrimitive(overrides));
}
