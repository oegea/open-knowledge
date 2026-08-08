import { getCourse } from '../../application/getCourse';
import * as CourseMother from '../helpers/CourseMother';
import * as CourseRepositoryMother from '../helpers/CourseRepositoryMother';

describe('getCourse (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('returns the course when it exists', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await getCourse({ id: 'course-1', courseRepository });

      expect(result).toBe(course);
      expect(courseRepository.findById).toHaveBeenCalledWith('course-1');
    });
  });

  describe('Error Scenarios', () => {
    it('throws when id is missing', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await expect(getCourse({ id: '', courseRepository })).rejects.toThrow(
        '[getCourse] Id must be provided'
      );
    });

    it('throws when the course does not exist', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await expect(getCourse({ id: 'missing', courseRepository })).rejects.toThrow(
        '[getCourse] Course with id missing not found'
      );
    });
  });
});
