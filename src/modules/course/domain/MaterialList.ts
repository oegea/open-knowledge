import { Material, MaterialPrimitive } from './Material';

export class MaterialList {
  private readonly materials: Material[];

  static create(materials: Material[] | null): MaterialList {
    return new MaterialList(materials);
  }

  static fromPrimitive(materials: MaterialPrimitive[] | null): MaterialList {
    if (materials === null) return MaterialList.create(null);
    return MaterialList.create(materials.map((material) => Material.fromPrimitive(material)));
  }

  private constructor(materials: Material[] | null) {
    this.materials = materials === null ? [] : materials;
  }

  getMaterials(): Material[] {
    return [...this.materials];
  }

  getMaterialById(id: string): Material | null {
    return this.materials.find((material) => material.getId() === id) || null;
  }

  addMaterial(material: Material): MaterialList {
    if (this.getMaterialById(material.getId()) !== null) {
      throw new Error(`[MaterialList] material with id ${material.getId()} already exists`);
    }
    return MaterialList.create([...this.materials, material]);
  }

  updateMaterial(updated: Material): MaterialList {
    const index = this.materials.findIndex((material) => material.getId() === updated.getId());
    if (index === -1) {
      throw new Error(`[MaterialList] material with id ${updated.getId()} not found`);
    }
    const next = [...this.materials];
    next[index] = updated;
    return MaterialList.create(next);
  }

  removeMaterial(id: string): MaterialList {
    if (this.getMaterialById(id) === null) {
      throw new Error(`[MaterialList] material with id ${id} not found`);
    }
    return MaterialList.create(this.materials.filter((material) => material.getId() !== id));
  }

  moveMaterial(id: string, newIndex: number): MaterialList {
    const index = this.materials.findIndex((material) => material.getId() === id);
    if (index === -1) {
      throw new Error(`[MaterialList] material with id ${id} not found`);
    }
    const boundedIndex = Math.max(0, Math.min(newIndex, this.materials.length - 1));
    const next = [...this.materials];
    const [moved] = next.splice(index, 1);
    next.splice(boundedIndex, 0, moved);
    return MaterialList.create(next);
  }

  isEmpty(): boolean {
    return this.materials.length === 0;
  }

  count(): number {
    return this.materials.length;
  }

  equals(other: MaterialList): boolean {
    if (this.materials.length !== other.materials.length) return false;
    return this.materials.every((material, i) => material.equals(other.materials[i]));
  }

  toPrimitive(): MaterialPrimitive[] {
    return this.materials.map((material) => material.toPrimitive());
  }
}
