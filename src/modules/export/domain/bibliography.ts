import { Course } from '../../course/domain/Course';
import { SourcePrimitive } from '../../course/domain/Source';

/**
 * Flattens every source of a course into a single bibliography:
 * course-level sources first, then material-level ones in reading
 * order, deduplicated so shared references appear once.
 */
export function collectBibliography(course: Course): SourcePrimitive[] {
  const seen = new Set<string>();
  const bibliography: SourcePrimitive[] = [];
  const push = (source: SourcePrimitive) => {
    const key = `${source.title}|${source.url ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    bibliography.push(source);
  };

  course.getSources().forEach((source) => push(source.toPrimitive()));
  course
    .getSections()
    .getSections()
    .forEach((section) =>
      section
        .getMaterials()
        .getMaterials()
        .forEach((material) => material.getSources().forEach((source) => push(source.toPrimitive())))
    );
  return bibliography;
}
