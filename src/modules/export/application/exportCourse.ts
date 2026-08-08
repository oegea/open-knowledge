import { CourseRepository } from '../../course/domain/CourseRepository';
import { SettingsRepository } from '../../settings/domain/SettingsRepository';
import {
  CourseExportRepository,
  ExportedDocument,
  ExportStrings,
} from '../domain/CourseExportRepository';

export interface CourseExportResult extends ExportedDocument {
  filename: string;
}

interface exportCourseProps {
  courseId: string;
  baseUrl: string;
  courseRepository: CourseRepository;
  settingsRepository: SettingsRepository;
  exportRepository: CourseExportRepository;
  /** Port: resolves the document copy in the course's own language. */
  stringsProvider: (language: string) => Promise<ExportStrings>;
}

function mediaPathOf(publicPath: string | null): string | null {
  if (!publicPath) return null;
  return publicPath.replace(/^\/api\/media\//, '');
}

/**
 * Renders a published course as a downloadable document (EPUB/PDF depending
 * on the injected repository): a front page crediting the library and Open
 * Knowledge, then one chapter per material.
 */
export async function exportCourse({
  courseId,
  baseUrl,
  courseRepository,
  settingsRepository,
  exportRepository,
  stringsProvider,
}: exportCourseProps): Promise<CourseExportResult> {
  if (!courseId) {
    throw new Error('[exportCourse] Course id must be provided');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null || !course.isPublished()) {
    throw new Error(`[exportCourse] Course with id ${courseId} not found`);
  }

  const settings = await settingsRepository.get();
  const strings = await stringsProvider(course.getLanguage());

  const document = await exportRepository.export(course, {
    libraryName: settings.getLibraryName(),
    ownerName: settings.getOwnerName() || settings.getLibraryName(),
    logoMediaPath: mediaPathOf(settings.getLogoPath()),
    coverMediaPath: mediaPathOf(course.getCoverImage()),
    courseUrl: `${baseUrl}/courses/${courseId}`,
    materialUrl: (materialId) => `${baseUrl}/courses/${courseId}/study/${materialId}`,
    generatedAt: new Date(),
    strings,
  });

  const safeTitle = course
    .getTitle()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60);

  return { ...document, filename: `${safeTitle || 'course'}.${document.extension}` };
}
