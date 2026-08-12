import { createCategory } from '../../application/createCategory';
import { updateCategory } from '../../application/updateCategory';
import { getCategory } from '../../application/getCategory';
import { listCategories } from '../../application/listCategories';
import { deleteCategory } from '../../application/deleteCategory';
import * as CategoryMother from '../helpers/CategoryMother';
import * as CategoryRepositoryMother from '../helpers/CategoryRepositoryMother';

describe('category use cases (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('saves the category with a trimmed name', async () => {
      const categoryRepository = CategoryRepositoryMother.create();

      const category = await createCategory({
        name: '  Science  ',
        imagePath: '/api/media/images/science.png',
        categoryRepository,
      });

      expect(category.getName()).toBe('Science');
      expect(category.getImagePath()).toBe('/api/media/images/science.png');
      expect(category.getId()).not.toBeNull();
      expect(categoryRepository.save).toHaveBeenCalledWith(category);
    });

    it('defaults the image to null', async () => {
      const category = await createCategory({
        name: 'Science',
        categoryRepository: CategoryRepositoryMother.create(),
      });

      expect(category.getImagePath()).toBeNull();
    });

    it('rejects an empty name', async () => {
      await expect(
        createCategory({ name: '  ', categoryRepository: CategoryRepositoryMother.create() })
      ).rejects.toThrow('[Category] name cannot be empty');
    });

    it('rejects a name longer than 100 characters', async () => {
      await expect(
        createCategory({
          name: 'x'.repeat(101),
          categoryRepository: CategoryRepositoryMother.create(),
        })
      ).rejects.toThrow('[Category] name cannot exceed 100 characters');
    });

    it('rejects a duplicate name', async () => {
      const categoryRepository = CategoryRepositoryMother.create({
        findByName: jest.fn().mockResolvedValue(CategoryMother.create()),
      });

      await expect(createCategory({ name: 'Science', categoryRepository })).rejects.toThrow(
        '[createCategory] a category named "Science" already exists'
      );
      expect(categoryRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('saves the new details', async () => {
      const existing = CategoryMother.create();
      const categoryRepository = CategoryRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(existing),
      });

      const updated = await updateCategory({
        id: 'category-1',
        name: 'Nature',
        imagePath: null,
        categoryRepository,
      });

      expect(updated.getName()).toBe('Nature');
      expect(updated.getImagePath()).toBeNull();
      expect(categoryRepository.save).toHaveBeenCalledWith(updated);
    });

    it('fires onCategoryRenamed only when the name changes', async () => {
      const existing = CategoryMother.create({ name: 'Science' });
      const categoryRepository = CategoryRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(existing),
      });
      const onCategoryRenamed = jest.fn().mockResolvedValue(undefined);

      await updateCategory({
        id: 'category-1',
        name: 'Nature',
        imagePath: null,
        categoryRepository,
        onCategoryRenamed,
      });

      expect(onCategoryRenamed).toHaveBeenCalledWith('Science', 'Nature');
    });

    it('does not fire onCategoryRenamed for an image-only change', async () => {
      const existing = CategoryMother.create({ name: 'Science' });
      const categoryRepository = CategoryRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(existing),
        findByName: jest.fn().mockResolvedValue(existing),
      });
      const onCategoryRenamed = jest.fn();

      await updateCategory({
        id: 'category-1',
        name: 'Science',
        imagePath: '/api/media/images/other.png',
        categoryRepository,
        onCategoryRenamed,
      });

      expect(onCategoryRenamed).not.toHaveBeenCalled();
    });

    it('rejects a name already used by another category', async () => {
      const categoryRepository = CategoryRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(CategoryMother.create({ id: 'category-1' })),
        findByName: jest.fn().mockResolvedValue(CategoryMother.create({ id: 'category-2', name: 'Nature' })),
      });

      await expect(
        updateCategory({ id: 'category-1', name: 'Nature', imagePath: null, categoryRepository })
      ).rejects.toThrow('[updateCategory] a category named "Nature" already exists');
      expect(categoryRepository.save).not.toHaveBeenCalled();
    });

    it('throws when the category does not exist', async () => {
      await expect(
        updateCategory({
          id: 'missing',
          name: 'Nature',
          imagePath: null,
          categoryRepository: CategoryRepositoryMother.create(),
        })
      ).rejects.toThrow('[updateCategory] Category with id missing not found');
    });
  });

  describe('getCategory', () => {
    it('returns the category', async () => {
      const existing = CategoryMother.create();
      const category = await getCategory({
        id: 'category-1',
        categoryRepository: CategoryRepositoryMother.create({
          findById: jest.fn().mockResolvedValue(existing),
        }),
      });

      expect(category).toBe(existing);
    });

    it('throws when missing', async () => {
      await expect(
        getCategory({ id: 'missing', categoryRepository: CategoryRepositoryMother.create() })
      ).rejects.toThrow('[getCategory] Category with id missing not found');
    });
  });

  describe('listCategories', () => {
    it('returns every category', async () => {
      const categories = [CategoryMother.create()];
      const listed = await listCategories({
        categoryRepository: CategoryRepositoryMother.create({
          findAll: jest.fn().mockResolvedValue(categories),
        }),
      });

      expect(listed).toBe(categories);
    });
  });

  describe('deleteCategory', () => {
    it('deletes by id', async () => {
      const categoryRepository = CategoryRepositoryMother.create();

      await deleteCategory({ id: 'category-1', categoryRepository });

      expect(categoryRepository.delete).toHaveBeenCalledWith('category-1');
    });

    it('throws when the category does not exist', async () => {
      await expect(
        deleteCategory({
          id: 'missing',
          categoryRepository: CategoryRepositoryMother.create({
            delete: jest.fn().mockResolvedValue(false),
          }),
        })
      ).rejects.toThrow('[deleteCategory] Category with id missing not found');
    });
  });
});
