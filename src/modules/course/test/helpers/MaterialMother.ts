import { Material, MaterialPrimitive } from '../../domain/Material';

export function createPrimitive(overrides: Partial<MaterialPrimitive> = {}): MaterialPrimitive {
  return {
    id: 'material-1',
    title: 'What is the Solar System?',
    type: 'markdown',
    markdown: '# The Solar System\n\nAn overview of our cosmic neighborhood.',
    mediaPath: null,
    exam: null,
    required: true,
    sources: [],
    transcriptPath: null,
    ...overrides,
  };
}

export function create(overrides: Partial<MaterialPrimitive> = {}): Material {
  return Material.fromPrimitive(createPrimitive(overrides));
}
