import { recategorizeCourses } from '../../application/recategorizeCourses';
import * as CourseRepositoryMother from '../helpers/CourseRepositoryMother';

describe('recategorizeCourses (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('relabels courses through the repository and returns the count', async () => {
    const courseRepository = CourseRepositoryMother.create({
      reassignCategory: jest.fn().mockResolvedValue(3),
    });

    const count = await recategorizeCourses({ from: 'Science', to: 'Nature', courseRepository });

    expect(count).toBe(3);
    expect(courseRepository.reassignCategory).toHaveBeenCalledWith('Science', 'Nature');
  });

  it('rejects a missing source category', async () => {
    await expect(
      recategorizeCourses({
        from: '',
        to: 'Nature',
        courseRepository: CourseRepositoryMother.create(),
      })
    ).rejects.toThrow('[recategorizeCourses] source category must be provided');
  });

  it('rejects a blank target category', async () => {
    await expect(
      recategorizeCourses({
        from: 'Science',
        to: '  ',
        courseRepository: CourseRepositoryMother.create(),
      })
    ).rejects.toThrow('[recategorizeCourses] target category must be provided');
  });

  it('rejects a target longer than 100 characters', async () => {
    await expect(
      recategorizeCourses({
        from: 'Science',
        to: 'x'.repeat(101),
        courseRepository: CourseRepositoryMother.create(),
      })
    ).rejects.toThrow('[Course] category cannot exceed 100 characters');
  });
});
