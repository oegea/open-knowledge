import type { Database } from 'better-sqlite3';
import { SqliteCourseRepository } from '../../infrastructure/SqliteCourseRepository';
import { createInMemoryDatabase } from '../../../shared/infrastructure/SqliteDatabase';
import * as CourseMother from '../helpers/CourseMother';
import * as SectionMother from '../helpers/SectionMother';
import * as MaterialMother from '../helpers/MaterialMother';
import * as ExamMother from '../helpers/ExamMother';

describe('SqliteCourseRepository (integration)', () => {
  let db: Database;
  let repository: SqliteCourseRepository;

  beforeEach(() => {
    db = createInMemoryDatabase();
    repository = new SqliteCourseRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('saves and retrieves a full course aggregate without loss', async () => {
    const course = CourseMother.create({
      sections: [
        SectionMother.createPrimitive({
          id: 's1',
          title: 'Basics',
          materials: [
            MaterialMother.createPrimitive({ id: 'm1' }),
            MaterialMother.createPrimitive({
              id: 'm2',
              title: 'Checkpoint exam',
              type: 'exam',
              markdown: '',
              exam: ExamMother.createPrimitive(),
              sources: [{ title: 'A book', url: null }],
            }),
          ],
        }),
        SectionMother.createPrimitive({ id: 's2', title: 'Advanced', materials: [] }),
      ],
    });

    await repository.save(course);
    const found = await repository.findById('course-1');

    expect(found).not.toBeNull();
    expect(found!.equals(course)).toBe(true);
    expect(found!.getSections().getSectionById('s1')!.getMaterials().count()).toBe(2);
    const exam = found!
      .getSections()
      .getSectionById('s1')!
      .getMaterials()
      .getMaterialById('m2')!
      .getExam();
    expect(exam?.getPassingScore()).toBe(0.7);
  });

  it('updates an existing course replacing its structure', async () => {
    const course = CourseMother.create();
    await repository.save(course);

    const renamed = course.setDetails({
      title: 'Renamed course',
      description: course.getDescription(),
      language: 'ca',
      category: null,
      coverImage: course.getCoverImage(),
      authors: [],
      sources: [],
      license: null,
      aiAssisted: true,
    });
    await repository.save(renamed);

    const found = await repository.findById('course-1');
    expect(found!.getTitle()).toBe('Renamed course');
    expect(found!.getLanguage()).toBe('ca');
    expect(found!.getCategory()).toBeNull();
    expect(found!.isAiAssisted()).toBe(true);
  });

  it('preserves section and material ordering', async () => {
    const course = CourseMother.create({
      sections: [
        SectionMother.createPrimitive({ id: 's1', materials: [] }),
        SectionMother.createPrimitive({ id: 's2', materials: [] }),
        SectionMother.createPrimitive({ id: 's3', materials: [] }),
      ],
    });
    await repository.save(course);

    const reordered = course.setSections(course.getSections().moveSection('s3', 0));
    await repository.save(reordered);

    const found = await repository.findById('course-1');
    expect(found!.getSections().getSections().map((s) => s.getId())).toEqual(['s3', 's1', 's2']);
  });

  it('returns null for unknown ids', async () => {
    expect(await repository.findById('missing')).toBeNull();
  });

  it('filters by published, language and category in findAll', async () => {
    await repository.save(
      CourseMother.create({ id: 'c1', published: true, language: 'es', sections: [] })
    );
    await repository.save(
      CourseMother.create({
        id: 'c2',
        published: false,
        language: 'es',
        category: 'History',
        sections: [],
      })
    );
    await repository.save(
      CourseMother.create({ id: 'c3', published: true, language: 'en', sections: [] })
    );

    const published = await repository.findAll({ publishedOnly: true });
    expect(published.count()).toBe(2);

    const spanish = await repository.findAll({ language: 'es' });
    expect(spanish.count()).toBe(2);

    const history = await repository.findAll({ category: 'History' });
    expect(history.getCourses().map((c) => c.getId())).toEqual(['c2']);

    const publishedSpanish = await repository.findAll({ publishedOnly: true, language: 'es' });
    expect(publishedSpanish.getCourses().map((c) => c.getId())).toEqual(['c1']);
  });

  it('findAll returns summaries without sections', async () => {
    await repository.save(CourseMother.create());

    const all = await repository.findAll();
    expect(all.count()).toBe(1);
    expect(all.getCourses()[0].getSections().isEmpty()).toBe(true);
  });

  it('deletes a course and cascades to sections and materials', async () => {
    await repository.save(CourseMother.create());

    expect(await repository.delete('course-1')).toBe(true);
    expect(await repository.findById('course-1')).toBeNull();
    expect(db.prepare('SELECT COUNT(*) AS c FROM sections').get()).toEqual({ c: 0 });
    expect(db.prepare('SELECT COUNT(*) AS c FROM materials').get()).toEqual({ c: 0 });
  });

  it('returns false when deleting a missing course', async () => {
    expect(await repository.delete('missing')).toBe(false);
  });
});
