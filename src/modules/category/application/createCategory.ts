import { randomUUID } from 'crypto';
import { Category } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';

interface createCategoryProps {
  name: string;
  imagePath?: string | null;
  categoryRepository: CategoryRepository;
}

export async function createCategory({
  name,
  imagePath,
  categoryRepository,
}: createCategoryProps): Promise<Category> {
  const category = Category.create(randomUUID(), name, imagePath ?? null);

  const existing = await categoryRepository.findByName(category.getName());
  if (existing !== null) {
    throw new Error(`[createCategory] a category named "${category.getName()}" already exists`);
  }

  return await categoryRepository.save(category);
}
