import { Exam, ExamPrimitive } from './Exam';
import { Source, SourcePrimitive } from './Source';

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
  sources?: SourcePrimitive[];
  transcriptPath?: string | null;
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
  sources: SourcePrimitive[];
  /**
   * Optional timed transcript (JSON, see `TimedTranscript`) for `audio` /
   * `video` materials: lets the study view highlight the narrated words in
   * sync with playback. `null` means plain playback.
   */
  transcriptPath: string | null;
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
    private readonly sources: Source[],
    private readonly transcriptPath: string | null
  ) {}

  static create(
    id: string,
    title: string,
    type: MaterialType,
    markdown: string,
    mediaPath: string | null,
    exam: Exam | null,
    required: boolean,
    sources: (SourcePrimitive | string)[] = [],
    transcriptPath: string | null = null
  ): Material {
    Material.ensureMaterialIsValid(id, title, type, markdown, mediaPath, exam, transcriptPath);
    return new Material(
      id,
      title.trim(),
      type,
      markdown ?? '',
      mediaPath,
      exam,
      required,
      sources.map((source) => Source.fromPrimitive(source)),
      transcriptPath?.trim() || null
    );
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
      data.sources ?? [],
      data.transcriptPath ?? null
    );
  }

  static ensureMaterialIsValid(
    id: string,
    title: string,
    type: MaterialType,
    markdown: string,
    mediaPath: string | null,
    exam: Exam | null,
    transcriptPath: string | null = null
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
    if (transcriptPath !== null && transcriptPath !== undefined && typeof transcriptPath !== 'string') {
      throw new Error('[Material] transcriptPath must be a string or null');
    }
    if (transcriptPath && transcriptPath.trim() !== '' && type !== 'audio' && type !== 'video') {
      throw new Error('[Material] only audio and video materials can have a transcript');
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

  getSources(): Source[] {
    return [...this.sources];
  }

  getTranscriptPath(): string | null {
    return this.transcriptPath;
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
      sources: this.sources.map((source) => source.toPrimitive()),
      transcriptPath: this.transcriptPath,
    };
  }

  equals(other: Material): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }
}
