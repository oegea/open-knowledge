import { exportCourse } from './exportCourse';
import { exportCourseMarkdown } from './exportCourseMarkdown';
import { ExportStrings } from '../domain/CourseExportRepository';
import { EpubCourseExportRepository } from '../infrastructure/EpubCourseExportRepository';
import { PdfCourseExportRepository } from '../infrastructure/PdfCourseExportRepository';
import { SqliteCourseRepository } from '../../course/infrastructure/SqliteCourseRepository';
import { StaticCourseRepository } from '../../course/infrastructure/StaticCourseRepository';
import { SqliteSettingsRepository } from '../../settings/infrastructure/SqliteSettingsRepository';
import { StaticSettingsRepository } from '../../settings/infrastructure/StaticSettingsRepository';
import { FilesystemMediaRepository } from '../../media/infrastructure/FilesystemMediaRepository';
import { StaticHttpMediaRepository } from '../../media/infrastructure/StaticHttpMediaRepository';
import { isStaticMode } from '../../shared/infrastructure/StaticContentClient';
import { getDictionary, translate } from '@/i18n/dictionary';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';

/** The document speaks the course's language, not the visitor's. */
async function stringsProvider(language: string): Promise<ExportStrings> {
  const dictionary = await getDictionary(isLocale(language) ? language : DEFAULT_LOCALE);
  return {
    generatedNote: translate(dictionary, 'export.generatedNote'),
    generatedWith: translate(dictionary, 'export.generatedWith'),
    aboutOpenKnowledge: translate(dictionary, 'export.aboutOpenKnowledge'),
    responsible: translate(dictionary, 'export.responsible'),
    consultOnline: translate(dictionary, 'export.consultOnline'),
    toc: translate(dictionary, 'export.toc'),
    license: translate(dictionary, 'course.license'),
    authors: translate(dictionary, 'admin.authors'),
    bibliography: translate(dictionary, 'course.bibliography'),
    aiNoticeTitle: translate(dictionary, 'course.aiNoticeTitle'),
    aiNotice: translate(dictionary, 'course.aiNotice'),
  };
}

export default {
  exportCourseMarkdown: async (courseId: string) =>
    await exportCourseMarkdown({
      courseId,
      courseRepository: isStaticMode() ? new StaticCourseRepository() : new SqliteCourseRepository(),
    }),

  exportCourse: async (courseId: string, format: 'epub' | 'pdf', baseUrl: string) => {
    // In static mode media lives in the content repository, not on local disk.
    const mediaRepository = isStaticMode()
      ? new StaticHttpMediaRepository()
      : new FilesystemMediaRepository();
    return await exportCourse({
      courseId,
      baseUrl,
      courseRepository: (isStaticMode() ? new StaticCourseRepository() : new SqliteCourseRepository()),
      settingsRepository: (isStaticMode() ? new StaticSettingsRepository() : new SqliteSettingsRepository()),
      exportRepository:
        format === 'epub'
          ? new EpubCourseExportRepository(mediaRepository)
          : new PdfCourseExportRepository(mediaRepository),
      stringsProvider,
    });
  },
};
