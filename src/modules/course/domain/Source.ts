export interface SourcePrimitive {
  title: string;
  url: string | null;
}

/**
 * A bibliography entry: attribution for course or material content.
 * Either a plain reference (book, archive, author) or a titled web link.
 */
export class Source {
  private constructor(
    private readonly title: string,
    private readonly url: string | null
  ) {}

  static create(title: string, url: string | null = null): Source {
    Source.ensureSourceIsValid(title, url);
    return new Source(title.trim(), url?.trim() || null);
  }

  /** Accepts the legacy plain-string format transparently. */
  static fromPrimitive(data: SourcePrimitive | string): Source {
    if (typeof data === 'string') return Source.create(data);
    if (!data) throw new Error('[Source] data must be provided');
    return Source.create(data.title, data.url ?? null);
  }

  static ensureSourceIsValid(title: string, url: string | null): void {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('[Source] title cannot be empty');
    }
    if (title.trim().length > 300) {
      throw new Error('[Source] title cannot exceed 300 characters');
    }
    if (url !== null && url.trim() !== '' && !/^https?:\/\/\S+$/.test(url.trim())) {
      throw new Error('[Source] url must be a valid http(s) link');
    }
  }

  getTitle(): string {
    return this.title;
  }

  getUrl(): string | null {
    return this.url;
  }

  toPrimitive(): SourcePrimitive {
    return { title: this.title, url: this.url };
  }

  equals(other: Source): boolean {
    return this.title === other.title && this.url === other.url;
  }
}
