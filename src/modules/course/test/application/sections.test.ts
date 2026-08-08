import { addSection } from '../../application/addSection';
import { updateSectionTitle } from '../../application/updateSectionTitle';
import { removeSection } from '../../application/removeSection';
import { moveSection } from '../../application/moveSection';
import * as CourseMother from '../helpers/CourseMother';
import * as SectionMother from '../helpers/SectionMother';
import * as CourseRepositoryMother from '../helpers/CourseRepositoryMother';

describe('section use cases (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addSection', () => {
    it('appends a new empty section and saves the course', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await addSection({
        courseId: 'course-1',
        title: 'Advanced Topics',
        courseRepository,
      });

      expect(result.getSections().count()).toBe(2);
      const added = result.getSections().getSections()[1];
      expect(added.getTitle()).toBe('Advanced Topics');
      expect(added.getMaterials().isEmpty()).toBe(true);
      expect(courseRepository.save).toHaveBeenCalledWith(result);
    });

    it('throws when the course does not exist', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await expect(
        addSection({ courseId: 'missing', title: 'X', courseRepository })
      ).rejects.toThrow('[addSection] Course with id missing not found');
    });
  });

  describe('updateSectionTitle', () => {
    it('renames the section', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await updateSectionTitle({
        courseId: 'course-1',
        sectionId: 'section-1',
        title: 'Renamed',
        courseRepository,
      });

      expect(result.getSections().getSectionById('section-1')?.getTitle()).toBe('Renamed');
    });

    it('throws when the section does not exist', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      await expect(
        updateSectionTitle({
          courseId: 'course-1',
          sectionId: 'missing',
          title: 'X',
          courseRepository,
        })
      ).rejects.toThrow('[updateSectionTitle] Section with id missing not found');
    });
  });

  describe('removeSection', () => {
    it('removes the section', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await removeSection({
        courseId: 'course-1',
        sectionId: 'section-1',
        courseRepository,
      });

      expect(result.getSections().isEmpty()).toBe(true);
    });
  });

  describe('moveSection', () => {
    it('reorders sections', async () => {
      const course = CourseMother.create({
        sections: [
          SectionMother.createPrimitive({ id: 's1', title: 'First' }),
          SectionMother.createPrimitive({ id: 's2', title: 'Second' }),
          SectionMother.createPrimitive({ id: 's3', title: 'Third' }),
        ],
      });
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await moveSection({
        courseId: 'course-1',
        sectionId: 's3',
        newIndex: 0,
        courseRepository,
      });

      expect(result.getSections().getSections().map((s) => s.getId())).toEqual(['s3', 's1', 's2']);
    });

    it('rejects a negative index', async () => {
      const courseRepository = CourseRepositoryMother.create();

      await expect(
        moveSection({ courseId: 'course-1', sectionId: 's1', newIndex: -1, courseRepository })
      ).rejects.toThrow('[moveSection] newIndex must be a non-negative integer');
    });
  });
});
