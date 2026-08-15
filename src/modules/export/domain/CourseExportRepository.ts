import { Course } from '../../course/domain/Course';

/** Localized copy used inside the generated document. */
export interface ExportStrings {
  generatedNote: string;
  generatedWith: string;
  aboutOpenKnowledge: string;
  responsible: string;
  consultOnline: string;
  toc: string;
  credits: string;
  license: string;
  authors: string;
  bibliography: string;
  aiNoticeTitle: string;
  aiNotice: string;
}

export interface ExportContext {
  libraryName: string;
  ownerName: string;
  /** Relative media path of the logo (without /api/media prefix), if any. */
  logoMediaPath: string | null;
  /** Relative media path of the course cover, if any. */
  coverMediaPath: string | null;
  /** Absolute URL of the course page. */
  courseUrl: string;
  /** Builds an absolute URL for a given material. */
  materialUrl: (materialId: string) => string;
  generatedAt: Date;
  strings: ExportStrings;
}

export interface ExportedDocument {
  data: Buffer;
  mime: string;
  extension: string;
}

export interface CourseExportRepository {
  export(course: Course, context: ExportContext): Promise<ExportedDocument>;
}
