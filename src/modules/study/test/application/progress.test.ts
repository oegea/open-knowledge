import { markMaterialCompleted } from '../../application/markMaterialCompleted';
import { trackMaterialVisit } from '../../application/trackMaterialVisit';
import { getCourseProgress } from '../../application/getCourseProgress';
import * as CourseProgressMother from '../helpers/CourseProgressMother';
import * as ProgressRepositoryMother from '../helpers/ProgressRepositoryMother';

describe('study progress use cases (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markMaterialCompleted', () => {
    it('marks the material and remembers it as the last visited', async () => {
      const progressRepository = ProgressRepositoryMother.create();

      const result = await markMaterialCompleted({
        courseId: 'course-1',
        materialId: 'm1',
        progressRepository,
      });

      expect(result.isMaterialCompleted('m1')).toBe(true);
      expect(result.getLastMaterialId()).toBe('m1');
      expect(progressRepository.saveProgress).toHaveBeenCalledWith(result);
    });

    it('is idempotent for already completed materials', async () => {
      const existing = CourseProgressMother.create({
        completedMaterialIds: ['m1'],
        lastMaterialId: 'm1',
      });
      const progressRepository = ProgressRepositoryMother.create({
        getProgress: jest.fn().mockResolvedValue(existing),
      });

      const result = await markMaterialCompleted({
        courseId: 'course-1',
        materialId: 'm1',
        progressRepository,
      });

      expect(result.getCompletedMaterialIds()).toEqual(['m1']);
    });

    it('throws when material id is missing', async () => {
      const progressRepository = ProgressRepositoryMother.create();

      await expect(
        markMaterialCompleted({ courseId: 'course-1', materialId: '', progressRepository })
      ).rejects.toThrow('[markMaterialCompleted] Material id must be provided');
    });
  });

  describe('trackMaterialVisit', () => {
    it('updates the last visited material without completing it', async () => {
      const progressRepository = ProgressRepositoryMother.create();

      const result = await trackMaterialVisit({
        courseId: 'course-1',
        materialId: 'm2',
        progressRepository,
      });

      expect(result.getLastMaterialId()).toBe('m2');
      expect(result.isMaterialCompleted('m2')).toBe(false);
    });
  });

  describe('getCourseProgress', () => {
    it('returns the stored progress', async () => {
      const existing = CourseProgressMother.create({ completedMaterialIds: ['m1', 'm2'] });
      const progressRepository = ProgressRepositoryMother.create({
        getProgress: jest.fn().mockResolvedValue(existing),
      });

      const result = await getCourseProgress({ courseId: 'course-1', progressRepository });

      expect(result.getCompletedMaterialIds()).toEqual(['m1', 'm2']);
    });
  });

  describe('CourseProgress domain', () => {
    it('computes the completion ratio over ordered materials', () => {
      const progress = CourseProgressMother.create({ completedMaterialIds: ['m1', 'm3'] });
      expect(progress.completionRatio(['m1', 'm2', 'm3', 'm4'])).toBe(0.5);
      expect(progress.completionRatio([])).toBe(0);
    });

    it('finds the next pending material in pedagogical order', () => {
      const progress = CourseProgressMother.create({ completedMaterialIds: ['m1'] });
      expect(progress.nextPendingMaterialId(['m1', 'm2', 'm3'])).toBe('m2');
    });

    it('falls back to the first material when everything is completed', () => {
      const progress = CourseProgressMother.create({
        completedMaterialIds: ['m1', 'm2'],
        lastMaterialId: null,
      });
      expect(progress.nextPendingMaterialId(['m1', 'm2'])).toBe('m1');
    });
  });
});
