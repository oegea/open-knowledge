import { exportCourse } from '../../application/exportCourse';
import { ExportStrings } from '../../domain/CourseExportRepository';
import { InstanceSettings } from '../../../settings/domain/InstanceSettings';
import * as CourseMother from '../../../course/test/helpers/CourseMother';
import * as CourseRepositoryMother from '../../../course/test/helpers/CourseRepositoryMother';
import * as SettingsRepositoryMother from '../../../identity/test/helpers/SettingsRepositoryMother';

const STRINGS: ExportStrings = {
  generatedNote: 'Generated on {date} from {url}.',
  generatedWith: 'Generated with Open Knowledge.',
  aboutOpenKnowledge: 'Open Knowledge is an open-source application.',
  responsible: 'Responsible: {owner}.',
  consultOnline: 'Consume online:',
  toc: 'Table of contents',
  credits: 'Credits',
  license: 'License',
  authors: 'Authors',
  bibliography: 'Bibliography',
  aiNoticeTitle: 'AI-assisted content',
  aiNotice: 'This course includes AI-assisted content.',
};

function exportRepositoryMother() {
  return {
    export: jest.fn().mockResolvedValue({
      data: Buffer.from('doc'),
      mime: 'application/epub+zip',
      extension: 'epub',
    }),
  };
}

describe('exportCourse (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports a published course with library context and course-language strings', async () => {
    const course = CourseMother.create({ published: true, language: 'es' });
    const exportRepository = exportRepositoryMother();
    const stringsProvider = jest.fn().mockResolvedValue(STRINGS);
    const settingsRepository = SettingsRepositoryMother.create({
      get: jest
        .fn()
        .mockResolvedValue(
          InstanceSettings.create('My Library', 'Ada', '/api/media/images/logo.png', null, false, null, null, '', '', null, true, false)
        ),
    });

    const result = await exportCourse({
      courseId: 'course-1',
      baseUrl: 'https://library.example',
      courseRepository: CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      }),
      settingsRepository,
      exportRepository,
      stringsProvider,
    });

    expect(stringsProvider).toHaveBeenCalledWith('es');
    expect(result.filename).toBe('introduction-to-astronomy.epub');
    expect(result.mime).toBe('application/epub+zip');

    const context = exportRepository.export.mock.calls[0][1];
    expect(context.libraryName).toBe('My Library');
    expect(context.ownerName).toBe('Ada');
    expect(context.logoMediaPath).toBe('images/logo.png');
    expect(context.courseUrl).toBe('https://library.example/courses/introduction-to-astronomy');
    expect(context.materialUrl('m1')).toBe(
      'https://library.example/courses/introduction-to-astronomy/study/m1'
    );
  });

  it('falls back to the library name as responsible owner', async () => {
    const exportRepository = exportRepositoryMother();

    await exportCourse({
      courseId: 'course-1',
      baseUrl: 'https://x',
      courseRepository: CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(CourseMother.create({ published: true })),
      }),
      settingsRepository: SettingsRepositoryMother.create(),
      exportRepository,
      stringsProvider: jest.fn().mockResolvedValue(STRINGS),
    });

    expect(exportRepository.export.mock.calls[0][1].ownerName).toBe('Open Knowledge');
  });

  it('refuses to export drafts', async () => {
    await expect(
      exportCourse({
        courseId: 'course-1',
        baseUrl: 'https://x',
        courseRepository: CourseRepositoryMother.create({
          findById: jest.fn().mockResolvedValue(CourseMother.create({ published: false })),
        }),
        settingsRepository: SettingsRepositoryMother.create(),
        exportRepository: exportRepositoryMother(),
        stringsProvider: jest.fn().mockResolvedValue(STRINGS),
      })
    ).rejects.toThrow('[exportCourse] Course with id course-1 not found');
  });
});
