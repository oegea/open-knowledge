import { MaterialList } from './MaterialList';
import { MaterialPrimitive } from './Material';

export interface SectionPrimitive {
  id: string;
  title: string;
  materials: MaterialPrimitive[];
}

export class Section {
  private constructor(
    private readonly id: string,
    private readonly title: string,
    private readonly materials: MaterialList
  ) {}

  static create(id: string, title: string, materials: MaterialList): Section {
    Section.ensureSectionIsValid(id, title);
    return new Section(id, title.trim(), materials);
  }

  static fromPrimitive(data: SectionPrimitive): Section {
    if (!data) throw new Error('[Section] data must be provided');
    return Section.create(data.id, data.title, MaterialList.fromPrimitive(data.materials ?? []));
  }

  static ensureSectionIsValid(id: string, title: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error('[Section] id must be a non-empty string');
    }
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('[Section] title cannot be empty');
    }
    if (title.trim().length > 200) {
      throw new Error('[Section] title cannot exceed 200 characters');
    }
  }

  getId(): string {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getMaterials(): MaterialList {
    return this.materials;
  }

  setTitle(title: string): Section {
    return Section.create(this.id, title, this.materials);
  }

  setMaterials(materials: MaterialList): Section {
    return Section.create(this.id, this.title, materials);
  }

  toPrimitive(): SectionPrimitive {
    return {
      id: this.id,
      title: this.title,
      materials: this.materials.toPrimitive(),
    };
  }

  equals(other: Section): boolean {
    return (
      this.id === other.id && this.title === other.title && this.materials.equals(other.materials)
    );
  }
}
