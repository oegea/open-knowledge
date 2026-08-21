import { ExportContext, ExportStrings } from '../../domain/CourseExportRepository';

export const STRINGS: ExportStrings = {
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
  notesPageTitle: 'Notes',
};

export function create(overrides: Partial<ExportContext> = {}): ExportContext {
  return {
    libraryName: 'My Library',
    ownerName: 'Ada',
    logoMediaPath: null,
    coverMediaPath: null,
    courseUrl: 'https://library.example/courses/introduction-to-astronomy',
    materialUrl: (materialId: string) =>
      `https://library.example/courses/introduction-to-astronomy/study/${materialId}`,
    notesPages: false,
    generatedAt: new Date('2026-08-15T10:00:00.000Z'),
    strings: STRINGS,
    ...overrides,
  };
}
