import { addMaterial } from '../../application/addMaterial';
import { updateMaterial } from '../../application/updateMaterial';
import { removeMaterial } from '../../application/removeMaterial';
import { moveMaterial } from '../../application/moveMaterial';
import * as CourseMother from '../helpers/CourseMother';
import * as SectionMother from '../helpers/SectionMother';
import * as MaterialMother from '../helpers/MaterialMother';
import * as ExamMother from '../helpers/ExamMother';
import * as CourseRepositoryMother from '../helpers/CourseRepositoryMother';

describe('material use cases (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addMaterial', () => {
    it('appends a markdown material to the section', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await addMaterial({
        courseId: 'course-1',
        sectionId: 'section-1',
        title: 'Stars',
        type: 'markdown',
        markdown: '# Stars',
        courseRepository,
      });

      const materials = result.getSections().getSectionById('section-1')!.getMaterials();
      expect(materials.count()).toBe(2);
      expect(materials.getMaterials()[1].getTitle()).toBe('Stars');
      expect(courseRepository.save).toHaveBeenCalledWith(result);
    });

    it('adds an exam material with a valid exam definition', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await addMaterial({
        courseId: 'course-1',
        sectionId: 'section-1',
        title: 'Final exam',
        type: 'exam',
        exam: ExamMother.createPrimitive(),
        courseRepository,
      });

      const materials = result.getSections().getSectionById('section-1')!.getMaterials();
      expect(materials.getMaterials()[1].isExam()).toBe(true);
      expect(materials.getMaterials()[1].getExam()?.count()).toBe(1);
    });

    it('rejects a video material without media path', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      await expect(
        addMaterial({
          courseId: 'course-1',
          sectionId: 'section-1',
          title: 'Video',
          type: 'video',
          courseRepository,
        })
      ).rejects.toThrow('[Material] video materials need a media path');

      expect(courseRepository.save).not.toHaveBeenCalled();
    });

    it('throws when the section does not exist', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      await expect(
        addMaterial({
          courseId: 'course-1',
          sectionId: 'missing',
          title: 'X',
          type: 'markdown',
          markdown: 'x',
          courseRepository,
        })
      ).rejects.toThrow('[addMaterial] Section with id missing not found');
    });
  });

  describe('updateMaterial', () => {
    it('updates the material content keeping its id', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await updateMaterial({
        courseId: 'course-1',
        sectionId: 'section-1',
        materialId: 'material-1',
        title: 'Updated title',
        type: 'markdown',
        markdown: 'Updated content',
        courseRepository,
      });

      const material = result
        .getSections()
        .getSectionById('section-1')!
        .getMaterials()
        .getMaterialById('material-1');
      expect(material?.getTitle()).toBe('Updated title');
      expect(material?.getMarkdown()).toBe('Updated content');
    });

    it('throws when the material does not exist', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      await expect(
        updateMaterial({
          courseId: 'course-1',
          sectionId: 'section-1',
          materialId: 'missing',
          title: 'X',
          type: 'markdown',
          markdown: 'x',
          courseRepository,
        })
      ).rejects.toThrow('[updateMaterial] Material with id missing not found');
    });
  });

  describe('removeMaterial', () => {
    it('removes the material from the section', async () => {
      const course = CourseMother.create();
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await removeMaterial({
        courseId: 'course-1',
        sectionId: 'section-1',
        materialId: 'material-1',
        courseRepository,
      });

      expect(result.getSections().getSectionById('section-1')!.getMaterials().isEmpty()).toBe(true);
    });
  });

  describe('moveMaterial', () => {
    it('reorders materials inside the section', async () => {
      const course = CourseMother.create({
        sections: [
          SectionMother.createPrimitive({
            id: 'section-1',
            materials: [
              MaterialMother.createPrimitive({ id: 'm1' }),
              MaterialMother.createPrimitive({ id: 'm2' }),
              MaterialMother.createPrimitive({ id: 'm3' }),
            ],
          }),
        ],
      });
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      const result = await moveMaterial({
        courseId: 'course-1',
        sectionId: 'section-1',
        materialId: 'm1',
        newIndex: 2,
        courseRepository,
      });

      const ids = result
        .getSections()
        .getSectionById('section-1')!
        .getMaterials()
        .getMaterials()
        .map((material) => material.getId());
      expect(ids).toEqual(['m2', 'm3', 'm1']);
    });
  });
});
