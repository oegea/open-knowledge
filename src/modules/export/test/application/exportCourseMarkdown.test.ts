import { exportCourseMarkdown } from '../../application/exportCourseMarkdown';
import * as CourseMother from '../../../course/test/helpers/CourseMother';
import * as CourseRepositoryMother from '../../../course/test/helpers/CourseRepositoryMother';

describe('exportCourseMarkdown (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flattens a published course into one markdown document', async () => {
    const course = CourseMother.create({ published: true });
    const courseRepository = CourseRepositoryMother.create({
      findById: jest.fn().mockResolvedValue(course),
    });

    const markdown = await exportCourseMarkdown({ courseId: 'course-1', courseRepository });

    expect(markdown).toContain(`# ${course.getTitle()}`);
    expect(markdown).toContain(course.getDescription());
    expect(markdown).toContain('License: CC BY-SA 4.0');
    expect(markdown).toContain('## 1.');
  });

  it('excludes exam questions and answers', async () => {
    const course = CourseMother.create({ published: true });
    const courseRepository = CourseRepositoryMother.create({
      findById: jest.fn().mockResolvedValue(course),
    });

    const markdown = await exportCourseMarkdown({ courseId: 'course-1', courseRepository });

    // The exam material exists in the fixture; its content must not leak.
    expect(markdown).not.toContain('correctChoiceId');
    const exam = course
      .getSections()
      .getSections()
      .flatMap((section) => section.getMaterials().getMaterials())
      .find((material) => material.getType() === 'exam');
    if (exam) {
      for (const question of exam.toPrimitive().exam!.questions) {
        expect(markdown).not.toContain(question.text);
      }
    }
  });

  it('resolves by slug and rejects unpublished courses', async () => {
    const draft = CourseMother.create({ published: false });
    const courseRepository = CourseRepositoryMother.create({
      findBySlug: jest.fn().mockResolvedValue(draft),
    });

    await expect(
      exportCourseMarkdown({ courseId: draft.getSlug(), courseRepository })
    ).rejects.toThrow('not found');
  });
});
