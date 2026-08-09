import { CourseRepository } from '../../course/domain/CourseRepository';

interface exportCourseMarkdownProps {
  /** Course id or slug. */
  courseId: string;
  courseRepository: CourseRepository;
}

/**
 * Flattens a published course into a single plain Markdown document,
 * following the llms.txt convention: a course served as text an AI
 * assistant (or a human) can read in one request.
 *
 * Exam questions and answers are deliberately excluded — a tutor should
 * quiz the learner with its own questions, not hand over the answer key.
 */
export async function exportCourseMarkdown({
  courseId,
  courseRepository,
}: exportCourseMarkdownProps): Promise<string> {
  if (!courseId) {
    throw new Error('[exportCourseMarkdown] Course id must be provided');
  }

  const course =
    (await courseRepository.findById(courseId)) ?? (await courseRepository.findBySlug(courseId));
  if (course === null || !course.isPublished()) {
    throw new Error(`[exportCourseMarkdown] Course with id ${courseId} not found`);
  }

  const lines: string[] = [];
  lines.push(`# ${course.getTitle()}`);
  lines.push('');
  lines.push(course.getDescription());
  lines.push('');
  if (course.getAuthors().length > 0) {
    lines.push(`Authors: ${course.getAuthors().join(', ')}`);
  }
  if (course.getLicense()) {
    lines.push(`License: ${course.getLicense()}`);
  }
  lines.push(`Language: ${course.getLanguage()}`);
  if (course.isAiAssisted()) {
    lines.push('Note: this course includes AI-assisted content.');
  }
  if (course.getSources().length > 0) {
    lines.push('');
    lines.push('Bibliography and sources:');
    for (const source of course.getSources()) {
      const url = source.toPrimitive().url;
      lines.push(`- ${source.getTitle()}${url ? ` (${url})` : ''}`);
    }
  }

  course
    .getSections()
    .getSections()
    .forEach((section, sectionIndex) => {
      lines.push('');
      lines.push(`## ${sectionIndex + 1}. ${section.getTitle()}`);
      for (const material of section.getMaterials().getMaterials()) {
        lines.push('');
        const type = material.getType();
        if (type === 'markdown') {
          lines.push(`### ${material.getTitle()}`);
          lines.push('');
          lines.push(material.getMarkdown().trim());
        } else if (type === 'exam') {
          lines.push(`### ${material.getTitle()} (exam)`);
          lines.push('');
          lines.push(
            '_This section includes an exam on the material above. Questions are answered in the course itself._'
          );
        } else {
          lines.push(`### ${material.getTitle()} (${type})`);
          lines.push('');
          lines.push(`_This is a ${type} material, available in the online course._`);
          if (material.getMarkdown().trim()) {
            lines.push('');
            lines.push(material.getMarkdown().trim());
          }
        }
      }
    });

  lines.push('');
  return lines.join('\n');
}
