import { Category } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';

interface listCategoriesProps {
  categoryRepository: CategoryRepository;
}

export async function listCategories({
  categoryRepository,
}: listCategoriesProps): Promise<Category[]> {
  return await categoryRepository.findAll();
}
