import { Section, SectionPrimitive } from './Section';

export class SectionList {
  private readonly sections: Section[];

  static create(sections: Section[] | null): SectionList {
    return new SectionList(sections);
  }

  static fromPrimitive(sections: SectionPrimitive[] | null): SectionList {
    if (sections === null) return SectionList.create(null);
    return SectionList.create(sections.map((section) => Section.fromPrimitive(section)));
  }

  private constructor(sections: Section[] | null) {
    this.sections = sections === null ? [] : sections;
  }

  getSections(): Section[] {
    return [...this.sections];
  }

  getSectionById(id: string): Section | null {
    return this.sections.find((section) => section.getId() === id) || null;
  }

  addSection(section: Section): SectionList {
    if (this.getSectionById(section.getId()) !== null) {
      throw new Error(`[SectionList] section with id ${section.getId()} already exists`);
    }
    return SectionList.create([...this.sections, section]);
  }

  updateSection(updated: Section): SectionList {
    const index = this.sections.findIndex((section) => section.getId() === updated.getId());
    if (index === -1) {
      throw new Error(`[SectionList] section with id ${updated.getId()} not found`);
    }
    const next = [...this.sections];
    next[index] = updated;
    return SectionList.create(next);
  }

  removeSection(id: string): SectionList {
    if (this.getSectionById(id) === null) {
      throw new Error(`[SectionList] section with id ${id} not found`);
    }
    return SectionList.create(this.sections.filter((section) => section.getId() !== id));
  }

  moveSection(id: string, newIndex: number): SectionList {
    const index = this.sections.findIndex((section) => section.getId() === id);
    if (index === -1) {
      throw new Error(`[SectionList] section with id ${id} not found`);
    }
    const boundedIndex = Math.max(0, Math.min(newIndex, this.sections.length - 1));
    const next = [...this.sections];
    const [moved] = next.splice(index, 1);
    next.splice(boundedIndex, 0, moved);
    return SectionList.create(next);
  }

  countMaterials(): number {
    return this.sections.reduce((total, section) => total + section.getMaterials().count(), 0);
  }

  isEmpty(): boolean {
    return this.sections.length === 0;
  }

  count(): number {
    return this.sections.length;
  }

  equals(other: SectionList): boolean {
    if (this.sections.length !== other.sections.length) return false;
    return this.sections.every((section, i) => section.equals(other.sections[i]));
  }

  toPrimitive(): SectionPrimitive[] {
    return this.sections.map((section) => section.toPrimitive());
  }
}
