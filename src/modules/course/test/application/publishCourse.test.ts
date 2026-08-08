import { publishCourse } from '../../application/publishCourse';
import { unpublishCourse } from '../../application/unpublishCourse';
import * as CourseMother from '../helpers/CourseMother';
import * as CourseRepositoryMother from '../helpers/CourseRepositoryMother';

describe('publishCourse / unpublishCourse (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('publishes a presentable course', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await publishCourse({ id: 'course-1', courseRepository });

      expect(result.isPublished()).toBe(true);
      expect(courseRepository.save).toHaveBeenCalledWith(result);
    });

    it('unpublishes a published course', async () => {
      const course = CourseMother.create({ published: true });
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await unpublishCourse({ id: 'course-1', courseRepository });

      expect(result.isPublished()).toBe(false);
    });
  });

  describe('Error Scenarios', () => {
    it('refuses to publish a course without cover image', async () => {
      const course = CourseMother.create({ coverImage: null });
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      await expect(publishCourse({ id: 'course-1', courseRepository })).rejects.toThrow(
        '[Course] cannot publish a course without a cover image'
      );

      expect(courseRepository.save).not.toHaveBeenCalled();
    });

    it('refuses to publish a course without materials', async () => {
      const course = CourseMother.create({ sections: [] });
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      await expect(publishCourse({ id: 'course-1', courseRepository })).rejects.toThrow(
        '[Course] cannot publish a course without materials'
      );
    });

    it('throws when the course does not exist', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await expect(publishCourse({ id: 'missing', courseRepository })).rejects.toThrow(
        '[publishCourse] Course with id missing not found'
      );
    });
  });
});
