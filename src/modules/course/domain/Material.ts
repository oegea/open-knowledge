import { Exam, ExamPrimitive } from './Exam';

export const MATERIAL_TYPES = ['markdown', 'audio', 'video', 'exam'] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

/** Editable material fields, as accepted by add/update use cases. */
export interface MaterialInput {
  title: string;
  type: MaterialType;
  markdown?: string;
  mediaPath?: string | null;
  exam?: ExamPrimitive | null;
  required?: boolean;
  sources?: string[];
}

export interface MaterialPrimitive {
  id: string;
  title: string;
  type: MaterialType;
  /** Markdown body for `markdown` materials; optional notes for audio/video. */
  markdown: string;
  /** Relative media path for `audio` / `video` materials. */
  mediaPath: string | null;
  /** Exam definition for `exam` materials. */
  exam: ExamPrimitive | null;
  /** Whether consuming this material is required to complete the course. */
  required: boolean;
  /** Optional attribution sources for this specific material. */
  sources: string[];
}

export class Material {
  private constructor(
    private readonly id: string,
    private readonly title: string,
    private readonly type: MaterialType,
    private readonly markdown: string,
    private readonly mediaPath: string | null,
    private readonly exam: Exam | null,
    private readonly required: boolean,
    private readonly sources: string[]
  ) {}

  static create(
    id: string,
    title: string,
    type: MaterialType,
    markdown: string,
    mediaPath: string | null,
    exam: Exam | null,
    required: boolean,
    sources: string[] = []
  ): Material {
    Material.ensureMaterialIsValid(id, title, type, markdown, mediaPath, exam);
    return new Material(id, title.trim(), type, markdown ?? '', mediaPath, exam, required, sources);
  }

  static fromPrimitive(data: MaterialPrimitive): Material {
    if (!data) throw new Error('[Material] data must be provided');
    return Material.create(
      data.id,
      data.title,
      data.type,
      data.markdown ?? '',
      data.mediaPath ?? null,
      data.exam ? Exam.fromPrimitive(data.exam) : null,
      Boolean(data.required),
      data.sources ?? []
    );
  }

  static ensureMaterialIsValid(
    id: string,
    title: string,
    type: MaterialType,
    markdown: string,
    mediaPath: string | null,
    exam: Exam | null
  ): void {
    if (!id || typeof id !== 'string') {
      throw new Error('[Material] id must be a non-empty string');
    }
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('[Material] title cannot be empty');
    }
    if (title.trim().length > 200) {
      throw new Error('[Material] title cannot exceed 200 characters');
    }
    if (!MATERIAL_TYPES.includes(type)) {
      throw new Error(`[Material] "${type}" is not a valid material type`);
    }
    if (type === 'markdown' && (typeof markdown !== 'string' || markdown.trim() === '')) {
      throw new Error('[Material] markdown materials need markdown content');
    }
    if ((type === 'audio' || type === 'video') && (!mediaPath || mediaPath.trim() === '')) {
      throw new Error(`[Material] ${type} materials need a media path`);
    }
    if (type === 'exam' && exam === null) {
      throw new Error('[Material] exam materials need an exam definition');
    }
  }

  getId(): string {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getType(): MaterialType {
    return this.type;
  }

  getMarkdown(): string {
    return this.markdown;
  }

  getMediaPath(): string | null {
    return this.mediaPath;
  }

  getExam(): Exam | null {
    return this.exam;
  }

  isRequired(): boolean {
    return this.required;
  }

  getSources(): string[] {
    return [...this.sources];
  }

  isExam(): boolean {
    return this.type === 'exam';
  }

  toPrimitive(): MaterialPrimitive {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      markdown: this.markdown,
      mediaPath: this.mediaPath,
      exam: this.exam ? this.exam.toPrimitive() : null,
      required: this.required,
      sources: [...this.sources],
    };
  }

  equals(other: Material): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }
}
