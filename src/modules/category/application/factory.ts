import { createCategory } from './createCategory';
import { updateCategory } from './updateCategory';
import { getCategory } from './getCategory';
import { listCategories } from './listCategories';
import { deleteCategory } from './deleteCategory';
import { SqliteCategoryRepository } from '../infrastructure/SqliteCategoryRepository';
import { StaticCategoryRepository } from '../infrastructure/StaticCategoryRepository';
import { isStaticMode } from '../../shared/infrastructure/StaticContentClient';
import courseFactory from '../../course/application/factory';

import type { CategoryRepository } from '../domain/CategoryRepository';

const categoryRepository = (): CategoryRepository =>
  isStaticMode() ? new StaticCategoryRepository() : new SqliteCategoryRepository();

const relabelCourses = async (from: string, to: string) => {
  await courseFactory.recategorizeCourses(from, to);
};

export default {
  createCategory: async (name: string, imagePath?: string | null) =>
    await createCategory({ name, imagePath, categoryRepository: categoryRepository() }),

  updateCategory: async (id: string, name: string, imagePath?: string | null) =>
    await updateCategory({
      id,
      name,
      imagePath,
      categoryRepository: categoryRepository(),
      onCategoryRenamed: relabelCourses,
    }),

  getCategory: async (id: string) =>
    await getCategory({ id, categoryRepository: categoryRepository() }),

  listCategories: async () => await listCategories({ categoryRepository: categoryRepository() }),

  deleteCategory: async (id: string) =>
    await deleteCategory({ id, categoryRepository: categoryRepository() }),
};
