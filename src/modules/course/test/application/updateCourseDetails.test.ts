import { updateCourseDetails } from '../../application/updateCourseDetails';
import * as CourseMother from '../helpers/CourseMother';
import * as CourseRepositoryMother from '../helpers/CourseRepositoryMother';

const details = {
  title: 'Updated title',
  description: 'Updated description',
  language: 'fr' as const,
  category: 'Updated',
  coverImage: '/media/covers/new.jpg',
  authors: ['New Author'],
  sources: [],
  license: 'CC BY-SA 4.0' as string | null,
  aiAssisted: true,
};

describe('updateCourseDetails (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('updates the details and saves the course', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await updateCourseDetails({ id: 'course-1', ...details, courseRepository });

      expect(result.getTitle()).toBe('Updated title');
      expect(result.getLanguage()).toBe('fr');
      expect(result.isAiAssisted()).toBe(true);
      // The slug follows the renamed title.
      expect(result.getSlug()).toBe('updated-title');
      expect(courseRepository.save).toHaveBeenCalledWith(result);
    });

    it('keeps the slug when the title does not change', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await updateCourseDetails({
        id: 'course-1',
        ...details,
        title: course.getTitle(),
        courseRepository,
      });

      expect(result.getSlug()).toBe(course.getSlug());
    });

    it('preserves sections when updating details', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await updateCourseDetails({ id: 'course-1', ...details, courseRepository });

      expect(result.getSections().equals(course.getSections())).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('throws when the course does not exist', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await expect(
        updateCourseDetails({ id: 'missing', ...details, courseRepository })
      ).rejects.toThrow('[updateCourseDetails] Course with id missing not found');

      expect(courseRepository.save).not.toHaveBeenCalled();
    });

    it('rejects invalid details without saving', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      await expect(
        updateCourseDetails({ id: 'course-1', ...details, title: '', courseRepository })
      ).rejects.toThrow('[CourseTitle] title cannot be empty');

      expect(courseRepository.save).not.toHaveBeenCalled();
    });
  });
});
