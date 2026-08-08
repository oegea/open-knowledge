import { deleteCourse } from '../../application/deleteCourse';
import * as CourseRepositoryMother from '../helpers/CourseRepositoryMother';

describe('deleteCourse (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('deletes the course through the repository', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await deleteCourse({ id: 'course-1', courseRepository });

      expect(courseRepository.delete).toHaveBeenCalledWith('course-1');
    });
  });

  describe('Error Scenarios', () => {
    it('throws when id is missing', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await expect(deleteCourse({ id: '', courseRepository })).rejects.toThrow(
        '[deleteCourse] Id must be provided'
      );
    });

    it('throws when the course does not exist', async () => {
      const courseRepository = CourseRepositoryMother.create({
        delete: jest.fn().mockResolvedValue(false),
      });

      await expect(deleteCourse({ id: 'missing', courseRepository })).rejects.toThrow(
        '[deleteCourse] Course with id missing not found'
      );
    });
  });
});
