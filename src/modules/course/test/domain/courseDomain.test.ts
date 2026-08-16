import { Course } from '../../domain/Course';
import { CourseList } from '../../domain/CourseList';
import { CourseTitle } from '../../domain/CourseTitle';
import { CourseDescription } from '../../domain/CourseDescription';
import { CourseLanguage } from '../../domain/CourseLanguage';
import { Material } from '../../domain/Material';
import { ExamQuestion } from '../../domain/ExamQuestion';
import { Exam } from '../../domain/Exam';
import * as CourseMother from '../helpers/CourseMother';
import * as ExamMother from '../helpers/ExamMother';
import * as MaterialMother from '../helpers/MaterialMother';

describe('course domain validation', () => {
  describe('CourseTitle', () => {
    it('trims and stores valid titles', () => {
      expect(CourseTitle.create('  Astronomy  ').getValue()).toBe('Astronomy');
    });

    it('rejects empty titles', () => {
      expect(() => CourseTitle.create('')).toThrow('[CourseTitle] title cannot be empty');
    });

    it('rejects titles over 200 characters', () => {
      expect(() => CourseTitle.create('x'.repeat(201))).toThrow(
        '[CourseTitle] title cannot exceed 200 characters'
      );
    });
  });

  describe('CourseDescription', () => {
    it('rejects empty descriptions', () => {
      expect(() => CourseDescription.create(' ')).toThrow(
        '[CourseDescription] description cannot be empty'
      );
    });

    it('rejects descriptions over 5000 characters', () => {
      expect(() => CourseDescription.create('x'.repeat(5001))).toThrow(
        '[CourseDescription] description cannot exceed 5000 characters'
      );
    });
  });

  describe('CourseLanguage', () => {
    it('accepts every supported locale', () => {
      ['es', 'en', 'zh', 'eu', 'ja'].forEach((code) => {
        expect(CourseLanguage.create(code).getValue()).toBe(code);
      });
    });

    it('rejects unsupported languages', () => {
      expect(() => CourseLanguage.create('klingon')).toThrow(
        '[CourseLanguage] "klingon" is not a supported language'
      );
    });
  });

  describe('Course publish rules', () => {
    it('publishes when cover image and materials exist', () => {
      const published = CourseMother.create().publish();
      expect(published.isPublished()).toBe(true);
    });

    it('refuses to publish without cover image', () => {
      expect(() => CourseMother.create({ coverImage: null }).publish()).toThrow(
        '[Course] cannot publish a course without a cover image'
      );
    });

    it('refuses to publish without materials', () => {
      expect(() => CourseMother.create({ sections: [] }).publish()).toThrow(
        '[Course] cannot publish a course without materials'
      );
    });

    it('round-trips through toPrimitive/fromPrimitive without loss', () => {
      const course = CourseMother.create();
      const roundTripped = Course.fromPrimitive(course.toPrimitive());
      expect(roundTripped.equals(course)).toBe(true);
    });
  });

  describe('CourseList category counts', () => {
    it('counts courses per category ignoring uncategorized ones', () => {
      const list = CourseList.create([
        CourseMother.create({ id: 'c1', slug: 'c1', category: 'Science' }),
        CourseMother.create({ id: 'c2', slug: 'c2', category: 'Science' }),
        CourseMother.create({ id: 'c3', slug: 'c3', category: 'History' }),
        CourseMother.create({ id: 'c4', slug: 'c4', category: null }),
      ]);

      expect(list.getCategoryCounts()).toEqual({ Science: 2, History: 1 });
    });

    it('returns an empty object for an empty list', () => {
      expect(CourseList.create(null).getCategoryCounts()).toEqual({});
    });
  });

  describe('Material validation', () => {
    it('requires markdown content for markdown materials', () => {
      expect(() => Material.create('id', 'Title', 'markdown', '', null, null, true)).toThrow(
        '[Material] markdown materials need markdown content'
      );
    });

    it('requires media path for audio materials', () => {
      expect(() => Material.create('id', 'Title', 'audio', '', null, null, true)).toThrow(
        '[Material] audio materials need a media path'
      );
    });

    it('requires an exam definition for exam materials', () => {
      expect(() => Material.create('id', 'Title', 'exam', '', null, null, true)).toThrow(
        '[Material] exam materials need an exam definition'
      );
    });

    it('rejects unknown material types', () => {
      expect(() =>
        Material.create('id', 'Title', 'podcast' as never, '', null, null, true)
      ).toThrow('[Material] "podcast" is not a valid material type');
    });

    it('keeps a transcript path on audio and video materials', () => {
      const audio = Material.create(
        'id', 'Title', 'audio', '', 'media/a.mp3', null, true, [], ' media/a.transcript.json '
      );
      expect(audio.getTranscriptPath()).toBe('media/a.transcript.json');
      expect(audio.toPrimitive().transcriptPath).toBe('media/a.transcript.json');
      expect(Material.fromPrimitive(audio.toPrimitive()).equals(audio)).toBe(true);
    });

    it('defaults the transcript path to null when absent from a primitive', () => {
      const primitive = MaterialMother.createPrimitive();
      delete (primitive as Partial<typeof primitive>).transcriptPath;
      expect(Material.fromPrimitive(primitive).getTranscriptPath()).toBeNull();
    });

    it('rejects a transcript on materials that are not audio or video', () => {
      expect(() =>
        Material.create('id', 'Title', 'markdown', 'Body', null, null, true, [], 'media/t.json')
      ).toThrow('[Material] only audio and video materials can have a transcript');
    });
  });

  describe('Exam validation', () => {
    it('rejects exams without questions', () => {
      expect(() => Exam.create([], 0.7)).toThrow('[Exam] an exam needs at least one question');
    });

    it('rejects passing scores outside 0..1', () => {
      const question = ExamQuestion.fromPrimitive(ExamMother.createPrimitive().questions[0]);
      expect(() => Exam.create([question], 1.5)).toThrow(
        '[Exam] passingScore must be a number between 0 and 1'
      );
    });

    it('rejects questions with fewer than 2 choices', () => {
      expect(() =>
        ExamQuestion.create('q1', 'Question?', [{ id: 'a', text: 'Only one' }], 'a', '')
      ).toThrow('[ExamQuestion] a question needs at least 2 choices');
    });

    it('rejects a correctChoiceId that references no choice', () => {
      expect(() =>
        ExamQuestion.create(
          'q1',
          'Question?',
          [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
          ],
          'z',
          ''
        )
      ).toThrow('[ExamQuestion] correctChoiceId must reference an existing choice');
    });

    it('identifies the correct choice', () => {
      const exam = ExamMother.create();
      const question = exam.getQuestions()[0];
      expect(question.isCorrectChoice('b')).toBe(true);
      expect(question.isCorrectChoice('a')).toBe(false);
    });
  });
});
