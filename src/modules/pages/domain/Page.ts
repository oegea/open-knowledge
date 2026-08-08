export const PAGE_PLACEMENTS = ['menu', 'footer', 'hidden'] as const;
export type PagePlacement = (typeof PAGE_PLACEMENTS)[number];

export interface PagePrimitive {
  id: string | null;
  title: string;
  /** URL slug derived from the title; unique among pages. */
  slug: string;
  markdown: string;
  placement: PagePlacement;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * An auxiliary content page authored by the administrator (about, legal
 * notices, …). Its placement decides where it is linked: in the menu, in the
 * small footer line, or nowhere (reachable only by URL).
 */
export class Page {
  private constructor(
    private readonly id: string | null,
    private readonly title: string,
    private readonly slug: string,
    private readonly markdown: string,
    private readonly placement: PagePlacement,
    private readonly position: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  static create(
    id: string | null,
    title: string,
    markdown: string,
    placement: PagePlacement,
    position: number = 0,
    slug: string = '',
    createdAt?: Date,
    updatedAt?: Date
  ): Page {
    Page.ensurePageIsValid(title, markdown, placement, position);
    const now = new Date();
    return new Page(
      id,
      title.trim(),
      slug,
      markdown,
      placement,
      position,
      createdAt ?? now,
      updatedAt ?? now
    );
  }

  static fromPrimitive(data: PagePrimitive): Page {
    if (!data) throw new Error('[Page] data must be provided');
    return Page.create(
      data.id,
      data.title,
      data.markdown,
      data.placement,
      data.position ?? 0,
      data.slug ?? '',
      data.createdAt ? new Date(data.createdAt) : undefined,
      data.updatedAt ? new Date(data.updatedAt) : undefined
    );
  }

  static ensurePageIsValid(
    title: string,
    markdown: string,
    placement: PagePlacement,
    position: number
  ): void {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('[Page] title cannot be empty');
    }
    if (title.trim().length > 100) {
      throw new Error('[Page] title cannot exceed 100 characters');
    }
    if (typeof markdown !== 'string' || markdown.trim() === '') {
      throw new Error('[Page] content cannot be empty');
    }
    if (!PAGE_PLACEMENTS.includes(placement)) {
      throw new Error(`[Page] "${placement}" is not a valid placement`);
    }
    if (!Number.isInteger(position)) {
      throw new Error('[Page] position must be an integer');
    }
  }

  getId(): string | null {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getSlug(): string {
    return this.slug;
  }

  withSlug(slug: string): Page {
    return new Page(
      this.id,
      this.title,
      slug,
      this.markdown,
      this.placement,
      this.position,
      this.createdAt,
      this.updatedAt
    );
  }

  getMarkdown(): string {
    return this.markdown;
  }

  getPlacement(): PagePlacement {
    return this.placement;
  }

  getPosition(): number {
    return this.position;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  setContent(title: string, markdown: string, placement: PagePlacement): Page {
    return Page.create(
      this.id,
      title,
      markdown,
      placement,
      this.position,
      this.slug,
      this.createdAt,
      new Date()
    );
  }

  equals(other: Page): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): PagePrimitive {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      markdown: this.markdown,
      placement: this.placement,
      position: this.position,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
