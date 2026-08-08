import { createCourse } from '../../application/createCourse';
import * as CourseRepositoryMother from '../helpers/CourseRepositoryMother';

describe('createCourse (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('creates a course with a generated id and saves it', async () => {
      const courseRepository = CourseRepositoryMother.create();

      const result = await createCourse({
        title: 'Introduction to Astronomy',
        description: 'A journey through the night sky.',
        language: 'en',
        courseRepository,
      });

      expect(result.getId()).toBeDefined();
      expect(result.getTitle()).toBe('Introduction to Astronomy');
      expect(result.isPublished()).toBe(false);
      expect(result.getSections().isEmpty()).toBe(true);
      expect(courseRepository.save).toHaveBeenCalledWith(result);
    });

    it('stores optional metadata when provided', async () => {
      const courseRepository = CourseRepositoryMother.create();

      const result = await createCourse({
        title: 'AI-curated history',
        description: 'A course distilled with AI assistance.',
        language: 'es',
        category: 'History',
        authors: ['Ada'],
        sources: [{ title: 'Public domain archives', url: 'https://example.org/archive' }],
        aiAssisted: true,
        courseRepository,
      });

      expect(result.getCategory()).toBe('History');
      expect(result.getAuthors()).toEqual(['Ada']);
      expect(result.getSources().map((source) => source.toPrimitive())).toEqual([
        { title: 'Public domain archives', url: 'https://example.org/archive' },
      ]);
      expect(result.isAiAssisted()).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('rejects an empty title', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await expect(
        createCourse({ title: '  ', description: 'desc', language: 'en', courseRepository })
      ).rejects.toThrow('[CourseTitle] title cannot be empty');

      expect(courseRepository.save).not.toHaveBeenCalled();
    });

    it('rejects an unsupported language', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await expect(
        createCourse({ title: 'Title', description: 'desc', language: 'xx', courseRepository })
      ).rejects.toThrow('[CourseLanguage] "xx" is not a supported language');
    });

    it('propagates repository failures', async () => {
      const courseRepository = CourseRepositoryMother.create({
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(
        createCourse({ title: 'Title', description: 'desc', language: 'en', courseRepository })
      ).rejects.toThrow('DB error');
    });
  });
});
