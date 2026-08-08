export interface NewsPostPrimitive {
  id: string | null;
  title: string;
  markdown: string;
  /** Optional featured image shown in the list and post header. */
  imagePath: string | null;
  /** Optional byline, written manually by the editor. Empty = not shown. */
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export class NewsPost {
  private constructor(
    private readonly id: string | null,
    private readonly title: string,
    private readonly markdown: string,
    private readonly imagePath: string | null,
    private readonly author: string,
    private readonly published: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  static create(
    id: string | null,
    title: string,
    markdown: string,
    published: boolean,
    imagePath: string | null = null,
    author: string = '',
    createdAt?: Date,
    updatedAt?: Date
  ): NewsPost {
    NewsPost.ensurePostIsValid(title, markdown, author);
    const now = new Date();
    return new NewsPost(
      id,
      title.trim(),
      markdown,
      imagePath?.trim() || null,
      author.trim(),
      published,
      createdAt ?? now,
      updatedAt ?? now
    );
  }

  static fromPrimitive(data: NewsPostPrimitive): NewsPost {
    if (!data) throw new Error('[NewsPost] data must be provided');
    return NewsPost.create(
      data.id,
      data.title,
      data.markdown,
      Boolean(data.published),
      data.imagePath ?? null,
      data.author ?? '',
      data.createdAt ? new Date(data.createdAt) : undefined,
      data.updatedAt ? new Date(data.updatedAt) : undefined
    );
  }

  static ensurePostIsValid(title: string, markdown: string, author: string = ''): void {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('[NewsPost] title cannot be empty');
    }
    if (title.trim().length > 200) {
      throw new Error('[NewsPost] title cannot exceed 200 characters');
    }
    if (typeof markdown !== 'string' || markdown.trim() === '') {
      throw new Error('[NewsPost] content cannot be empty');
    }
    if (typeof author !== 'string' || author.trim().length > 100) {
      throw new Error('[NewsPost] author cannot exceed 100 characters');
    }
  }

  getId(): string | null {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getMarkdown(): string {
    return this.markdown;
  }

  getImagePath(): string | null {
    return this.imagePath;
  }

  getAuthor(): string {
    return this.author;
  }

  isPublished(): boolean {
    return this.published;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  setContent(
    title: string,
    markdown: string,
    published: boolean,
    imagePath: string | null,
    author: string
  ): NewsPost {
    return NewsPost.create(
      this.id,
      title,
      markdown,
      published,
      imagePath,
      author,
      this.createdAt,
      new Date()
    );
  }

  equals(other: NewsPost): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): NewsPostPrimitive {
    return {
      id: this.id,
      title: this.title,
      markdown: this.markdown,
      imagePath: this.imagePath,
      author: this.author,
      published: this.published,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
