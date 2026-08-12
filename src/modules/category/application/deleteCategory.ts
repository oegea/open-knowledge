import { CategoryRepository } from '../domain/CategoryRepository';

interface deleteCategoryProps {
  id: string;
  categoryRepository: CategoryRepository;
}

/**
 * Deletes the category entity only. Courses keep their free-text category
 * string; their landing card degrades to the auto-generated one (ADR 0015).
 */
export async function deleteCategory({ id, categoryRepository }: deleteCategoryProps): Promise<void> {
  if (!id) {
    throw new Error('[deleteCategory] Id must be provided');
  }

  const deleted = await categoryRepository.delete(id);
  if (!deleted) {
    throw new Error(`[deleteCategory] Category with id ${id} not found`);
  }
}
