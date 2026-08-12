export interface CategoryPrimitive {
  id: string | null;
  /** Unique display name; courses reference categories by this exact string. */
  name: string;
  /** Optional card image shown on the home landing page. */
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export class Category {
  private constructor(
    private readonly id: string | null,
    private readonly name: string,
    private readonly imagePath: string | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  static create(
    id: string | null,
    name: string,
    imagePath: string | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ): Category {
    Category.ensureCategoryIsValid(name);
    const now = new Date();
    return new Category(id, name.trim(), imagePath?.trim() || null, createdAt ?? now, updatedAt ?? now);
  }

  static fromPrimitive(data: CategoryPrimitive): Category {
    if (!data) throw new Error('[Category] data must be provided');
    return Category.create(
      data.id,
      data.name,
      data.imagePath ?? null,
      data.createdAt ? new Date(data.createdAt) : undefined,
      data.updatedAt ? new Date(data.updatedAt) : undefined
    );
  }

  static ensureCategoryIsValid(name: string): void {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('[Category] name cannot be empty');
    }
    if (name.trim().length > 100) {
      throw new Error('[Category] name cannot exceed 100 characters');
    }
  }

  getId(): string | null {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getImagePath(): string | null {
    return this.imagePath;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  setDetails(name: string, imagePath: string | null): Category {
    return Category.create(this.id, name, imagePath, this.createdAt, new Date());
  }

  equals(other: Category): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): CategoryPrimitive {
    return {
      id: this.id,
      name: this.name,
      imagePath: this.imagePath,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
