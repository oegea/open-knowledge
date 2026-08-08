import { listCourses } from '../../application/listCourses';
import { CourseList } from '../../domain/CourseList';
import * as CourseMother from '../helpers/CourseMother';
import * as CourseRepositoryMother from '../helpers/CourseRepositoryMother';

describe('listCourses (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('returns all courses from the repository', async () => {
      const courses = CourseList.create([
        CourseMother.create({ id: 'a' }),
        CourseMother.create({ id: 'b' }),
      ]);
      const courseRepository = CourseRepositoryMother.create({
        findAll: jest.fn().mockResolvedValue(courses),
      });

      const result = await listCourses({ courseRepository });

      expect(result.count()).toBe(2);
      expect(courseRepository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('forwards the filter to the repository', async () => {
      const courseRepository = CourseRepositoryMother.create();
      const filter = { publishedOnly: true, language: 'es' };

      await listCourses({ filter, courseRepository });

      expect(courseRepository.findAll).toHaveBeenCalledWith(filter);
    });
  });
});
