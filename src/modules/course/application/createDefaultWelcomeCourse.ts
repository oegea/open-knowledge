import { randomUUID } from 'crypto';
import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';
import { Section } from '../domain/Section';
import { Material } from '../domain/Material';
import { MaterialList } from '../domain/MaterialList';
import { SectionList } from '../domain/SectionList';
import { Exam } from '../domain/Exam';

const GUIDE_MARKDOWN = `# Welcome to your library

This is a sample course, created as a **draft** so only you — the administrator — can see it. It exists to show you how Open Knowledge courses work. Feel free to edit it, publish it, or delete it.

## How courses are structured

A course is divided into **sections** (logical divisions of what you want to teach), and each section contains **materials** in a deliberate pedagogical order:

- **Text** — Markdown documents, like this one.
- **Audio** and **video** — uploaded media with optional notes.
- **Exams** — simple question-and-answer checks with explanations.

## Publishing

A course needs a **cover image** and at least one material before it can be published. Add a cover from the *Details* tab of the course editor, then press *Publish* — from that moment anyone can study it, no account required.

## A few tips

1. Write materials so each one covers a single idea.
2. Credit your sources in the bibliography — especially for AI-assisted content.
3. Choose a content license (for example CC BY-SA 4.0) so others know how they may reuse your work.

Enjoy building your library!`;

const SAMPLE_EXAM = Exam.fromPrimitive({
  questions: [
    {
      id: 'q1',
      text: 'Who can study a published course?',
      choices: [
        { id: 'a', text: 'Only registered users' },
        { id: 'b', text: 'Anyone, no account required' },
        { id: 'c', text: 'Only the administrator' },
      ],
      correctChoiceId: 'b',
      explanation:
        'Open Knowledge never puts registration in front of knowledge: accounts exist only to keep personal progress and certificates.',
    },
    {
      id: 'q2',
      text: 'What does a course need before it can be published?',
      choices: [
        { id: 'a', text: 'A cover image and at least one material' },
        { id: 'b', text: 'At least ten materials' },
        { id: 'c', text: 'An exam' },
      ],
      correctChoiceId: 'a',
      explanation: 'A cover and one material are the minimum for a presentable course.',
    },
  ],
  passingScore: 0.5,
});

interface createDefaultWelcomeCourseProps {
  courseRepository: CourseRepository;
}

/**
 * Seeds a draft welcome course (in English) when the instance is
 * bootstrapped, so the first administrator sees how courses work.
 */
export async function createDefaultWelcomeCourse({
  courseRepository,
}: createDefaultWelcomeCourseProps): Promise<Course | null> {
  if ((await courseRepository.findAll()).count() > 0) return null;

  const materials = MaterialList.create([
    Material.create(
      randomUUID(),
      'How Open Knowledge courses work',
      'markdown',
      GUIDE_MARKDOWN,
      null,
      null,
      true
    ),
    Material.create(
      randomUUID(),
      'Sample exam: did it stick?',
      'exam',
      '',
      null,
      SAMPLE_EXAM,
      true
    ),
  ]);

  const course = Course.create(
    randomUUID(),
    'Creating your first course',
    'A short guide to how courses, sections, materials and exams work in Open Knowledge. This draft is only visible to you — edit it, publish it or delete it.',
    'en',
    {
      category: 'Getting started',
      license: 'CC BY-SA 4.0',
      sections: SectionList.create([Section.create(randomUUID(), 'The basics', materials)]),
    }
  );

  return await courseRepository.save(course);
}
