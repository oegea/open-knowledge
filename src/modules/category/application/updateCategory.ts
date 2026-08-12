import { Category } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';

interface updateCategoryProps {
  id: string;
  name: string;
  imagePath?: string | null;
  categoryRepository: CategoryRepository;
  /** Port: relabels courses still carrying the old category name. */
  onCategoryRenamed?: (from: string, to: string) => Promise<void>;
}

export async function updateCategory({
  id,
  name,
  imagePath,
  categoryRepository,
  onCategoryRenamed,
}: updateCategoryProps): Promise<Category> {
  if (!id) {
    throw new Error('[updateCategory] Id must be provided');
  }

  const category = await categoryRepository.findById(id);
  if (category === null) {
    throw new Error(`[updateCategory] Category with id ${id} not found`);
  }

  const updated = category.setDetails(name, imagePath ?? null);

  const conflicting = await categoryRepository.findByName(updated.getName());
  if (conflicting !== null && conflicting.getId() !== id) {
    throw new Error(`[updateCategory] a category named "${updated.getName()}" already exists`);
  }

  const saved = await categoryRepository.save(updated);

  if (category.getName() !== saved.getName() && onCategoryRenamed) {
    await onCategoryRenamed(category.getName(), saved.getName());
  }

  return saved;
}
