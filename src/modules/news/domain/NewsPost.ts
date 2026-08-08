export interface NewsPostPrimitive {
  id: string | null;
  title: string;
  markdown: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export class NewsPost {
  private constructor(
    private readonly id: string | null,
    private readonly title: string,
    private readonly markdown: string,
    private readonly published: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  static create(
    id: string | null,
    title: string,
    markdown: string,
    published: boolean,
    createdAt?: Date,
    updatedAt?: Date
  ): NewsPost {
    NewsPost.ensurePostIsValid(title, markdown);
    const now = new Date();
    return new NewsPost(id, title.trim(), markdown, published, createdAt ?? now, updatedAt ?? now);
  }

  static fromPrimitive(data: NewsPostPrimitive): NewsPost {
    if (!data) throw new Error('[NewsPost] data must be provided');
    return NewsPost.create(
      data.id,
      data.title,
      data.markdown,
      Boolean(data.published),
      data.createdAt ? new Date(data.createdAt) : undefined,
      data.updatedAt ? new Date(data.updatedAt) : undefined
    );
  }

  static ensurePostIsValid(title: string, markdown: string): void {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('[NewsPost] title cannot be empty');
    }
    if (title.trim().length > 200) {
      throw new Error('[NewsPost] title cannot exceed 200 characters');
    }
    if (typeof markdown !== 'string' || markdown.trim() === '') {
      throw new Error('[NewsPost] content cannot be empty');
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

  isPublished(): boolean {
    return this.published;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  setContent(title: string, markdown: string, published: boolean): NewsPost {
    return NewsPost.create(this.id, title, markdown, published, this.createdAt, new Date());
  }

  equals(other: NewsPost): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): NewsPostPrimitive {
    return {
      id: this.id,
      title: this.title,
      markdown: this.markdown,
      published: this.published,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
