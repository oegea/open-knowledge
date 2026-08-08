import { mergeProgress } from '../../application/mergeProgress';
import * as CourseProgressMother from '../helpers/CourseProgressMother';
import * as ProgressRepositoryMother from '../helpers/ProgressRepositoryMother';

describe('mergeProgress (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('merges device progress into the account store', async () => {
    const sourceRepository = ProgressRepositoryMother.create({
      getProgress: jest.fn().mockResolvedValue(
        CourseProgressMother.create({ completedMaterialIds: ['m1', 'm2'], lastMaterialId: 'm2' })
      ),
    });
    const targetRepository = ProgressRepositoryMother.create({
      getProgress: jest.fn().mockResolvedValue(
        CourseProgressMother.create({ completedMaterialIds: ['m3'], lastMaterialId: null })
      ),
    });

    const merged = await mergeProgress({
      courseId: 'course-1',
      sourceRepository,
      targetRepository,
    });

    expect(merged.getCompletedMaterialIds().sort()).toEqual(['m1', 'm2', 'm3']);
    expect(merged.getLastMaterialId()).toBe('m2');
    expect(targetRepository.saveProgress).toHaveBeenCalledWith(merged);
  });

  it('does not touch the target when the source is empty', async () => {
    const targetRepository = ProgressRepositoryMother.create({
      getProgress: jest.fn().mockResolvedValue(
        CourseProgressMother.create({ completedMaterialIds: ['m3'], lastMaterialId: 'm3' })
      ),
    });

    const merged = await mergeProgress({
      courseId: 'course-1',
      sourceRepository: ProgressRepositoryMother.create(),
      targetRepository,
    });

    expect(merged.getCompletedMaterialIds()).toEqual(['m3']);
    expect(targetRepository.saveProgress).not.toHaveBeenCalled();
  });

  it('keeps the target last visited material when it already has one', async () => {
    const sourceRepository = ProgressRepositoryMother.create({
      getProgress: jest.fn().mockResolvedValue(
        CourseProgressMother.create({ completedMaterialIds: ['m1'], lastMaterialId: 'm1' })
      ),
    });
    const targetRepository = ProgressRepositoryMother.create({
      getProgress: jest.fn().mockResolvedValue(
        CourseProgressMother.create({ completedMaterialIds: [], lastMaterialId: 'm5' })
      ),
    });

    const merged = await mergeProgress({
      courseId: 'course-1',
      sourceRepository,
      targetRepository,
    });

    expect(merged.getLastMaterialId()).toBe('m5');
  });
});
