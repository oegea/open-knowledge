import { Category } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';

interface getCategoryProps {
  id: string;
  categoryRepository: CategoryRepository;
}

export async function getCategory({ id, categoryRepository }: getCategoryProps): Promise<Category> {
  if (!id) {
    throw new Error('[getCategory] Id must be provided');
  }

  const category = await categoryRepository.findById(id);
  if (category === null) {
    throw new Error(`[getCategory] Category with id ${id} not found`);
  }

  return category;
}
