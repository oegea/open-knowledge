import { CourseTitle } from './CourseTitle';
import { Source, SourcePrimitive } from './Source';
import { CourseDescription } from './CourseDescription';
import { CourseLanguage } from './CourseLanguage';
import { SectionList } from './SectionList';
import { SectionPrimitive } from './Section';

export interface CoursePrimitive {
  id: string | null;
  title: string;
  description: string;
  language: string;
  category: string | null;
  coverImage: string | null;
  authors: string[];
  sources: SourcePrimitive[];
  aiAssisted: boolean;
  published: boolean;
  sections: SectionPrimitive[];
  createdAt: string;
  updatedAt: string;
}

/** Editable course details, as accepted by create/update use cases. */
export interface CourseDetailsInput {
  title: string;
  description: string;
  language: string;
  category: string | null;
  coverImage: string | null;
  authors: string[];
  sources: SourcePrimitive[];
  aiAssisted: boolean;
}

interface CourseProps {
  id: string | null;
  title: CourseTitle;
  description: CourseDescription;
  language: CourseLanguage;
  category: string | null;
  coverImage: string | null;
  authors: string[];
  sources: Source[];
  aiAssisted: boolean;
  published: boolean;
  sections: SectionList;
  createdAt: Date;
  updatedAt: Date;
}

export class Course {
  private constructor(private readonly props: CourseProps) {}

  static create(
    id: string | null,
    title: string,
    description: string,
    language: string,
    options: {
      category?: string | null;
      coverImage?: string | null;
      authors?: string[];
      sources?: (SourcePrimitive | string)[];
      aiAssisted?: boolean;
      published?: boolean;
      sections?: SectionList;
      createdAt?: Date;
      updatedAt?: Date;
    } = {}
  ): Course {
    Course.ensureCourseIsValid(options.category ?? null);
    const now = new Date();
    return new Course({
      id,
      title: CourseTitle.create(title),
      description: CourseDescription.create(description),
      language: CourseLanguage.create(language),
      category: options.category?.trim() || null,
      coverImage: options.coverImage ?? null,
      authors: options.authors ?? [],
      sources: (options.sources ?? []).map((source) => Source.fromPrimitive(source)),
      aiAssisted: options.aiAssisted ?? false,
      published: options.published ?? false,
      sections: options.sections ?? SectionList.create(null),
      createdAt: options.createdAt ?? now,
      updatedAt: options.updatedAt ?? now,
    });
  }

  static fromPrimitive(data: CoursePrimitive): Course {
    if (!data) throw new Error('[Course] data must be provided');
    return Course.create(data.id, data.title, data.description, data.language, {
      category: data.category,
      coverImage: data.coverImage,
      authors: data.authors ?? [],
      sources: data.sources ?? [],
      aiAssisted: Boolean(data.aiAssisted),
      published: Boolean(data.published),
      sections: SectionList.fromPrimitive(data.sections ?? []),
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    });
  }

  static ensureCourseIsValid(category: string | null): void {
    if (category !== null && category.trim().length > 100) {
      throw new Error('[Course] category cannot exceed 100 characters');
    }
  }

  getId(): string | null {
    return this.props.id;
  }

  getTitle(): string {
    return this.props.title.toPrimitive();
  }

  getDescription(): string {
    return this.props.description.toPrimitive();
  }

  getLanguage(): string {
    return this.props.language.toPrimitive();
  }

  getCategory(): string | null {
    return this.props.category;
  }

  getCoverImage(): string | null {
    return this.props.coverImage;
  }

  getAuthors(): string[] {
    return [...this.props.authors];
  }

  getSources(): Source[] {
    return [...this.props.sources];
  }

  isAiAssisted(): boolean {
    return this.props.aiAssisted;
  }

  isPublished(): boolean {
    return this.props.published;
  }

  getSections(): SectionList {
    return this.props.sections;
  }

  getCreatedAt(): Date {
    return new Date(this.props.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  setId(id: string): Course {
    return new Course({ ...this.props, id });
  }

  setDetails(details: CourseDetailsInput): Course {
    Course.ensureCourseIsValid(details.category);
    return new Course({
      ...this.props,
      title: CourseTitle.create(details.title),
      description: CourseDescription.create(details.description),
      language: CourseLanguage.create(details.language),
      category: details.category?.trim() || null,
      coverImage: details.coverImage,
      authors: details.authors,
      sources: details.sources.map((source) => Source.fromPrimitive(source)),
      aiAssisted: details.aiAssisted,
      updatedAt: new Date(),
    });
  }

  setSections(sections: SectionList): Course {
    return new Course({ ...this.props, sections, updatedAt: new Date() });
  }

  /**
   * A course can only be published when it is presentable: it has a cover
   * image and at least one material to study.
   */
  publish(): Course {
    if (!this.props.coverImage) {
      throw new Error('[Course] cannot publish a course without a cover image');
    }
    if (this.props.sections.countMaterials() === 0) {
      throw new Error('[Course] cannot publish a course without materials');
    }
    return new Course({ ...this.props, published: true, updatedAt: new Date() });
  }

  unpublish(): Course {
    return new Course({ ...this.props, published: false, updatedAt: new Date() });
  }

  equals(other: Course): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): CoursePrimitive {
    return {
      id: this.props.id,
      title: this.props.title.toPrimitive(),
      description: this.props.description.toPrimitive(),
      language: this.props.language.toPrimitive(),
      category: this.props.category,
      coverImage: this.props.coverImage,
      authors: [...this.props.authors],
      sources: this.props.sources.map((source) => source.toPrimitive()),
      aiAssisted: this.props.aiAssisted,
      published: this.props.published,
      sections: this.props.sections.toPrimitive(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
