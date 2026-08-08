import { Section, SectionPrimitive } from '../../domain/Section';
import * as MaterialMother from './MaterialMother';

export function createPrimitive(overrides: Partial<SectionPrimitive> = {}): SectionPrimitive {
  return {
    id: 'section-1',
    title: 'Getting Started',
    materials: [MaterialMother.createPrimitive()],
    ...overrides,
  };
}

export function create(overrides: Partial<SectionPrimitive> = {}): Section {
  return Section.fromPrimitive(createPrimitive(overrides));
}
