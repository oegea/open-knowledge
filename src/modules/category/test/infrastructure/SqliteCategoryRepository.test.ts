import type { Database } from 'better-sqlite3';
import { SqliteCategoryRepository } from '../../infrastructure/SqliteCategoryRepository';
import { createInMemoryDatabase } from '../../../shared/infrastructure/SqliteDatabase';
import * as CategoryMother from '../helpers/CategoryMother';

describe('SqliteCategoryRepository (integration)', () => {
  let db: Database;
  let repository: SqliteCategoryRepository;

  beforeEach(() => {
    db = createInMemoryDatabase();
    repository = new SqliteCategoryRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('saves and reads back a category', async () => {
    const category = CategoryMother.create();

    await repository.save(category);
    const found = await repository.findById('category-1');

    expect(found?.toPrimitive()).toEqual(category.toPrimitive());
  });

  it('updates on conflict by id', async () => {
    await repository.save(CategoryMother.create());
    await repository.save(CategoryMother.create({ name: 'Nature', imagePath: null }));

    const found = await repository.findById('category-1');
    expect(found?.getName()).toBe('Nature');
    expect(found?.getImagePath()).toBeNull();
    expect(await repository.findAll()).toHaveLength(1);
  });

  it('finds by exact name only', async () => {
    await repository.save(CategoryMother.create());

    expect(await repository.findByName('Science')).not.toBeNull();
    expect(await repository.findByName('science')).toBeNull();
    expect(await repository.findByName('Scien')).toBeNull();
  });

  it('rejects a duplicate name at the schema level', async () => {
    await repository.save(CategoryMother.create({ id: 'category-1', name: 'Science' }));

    await expect(
      repository.save(CategoryMother.create({ id: 'category-2', name: 'Science' }))
    ).rejects.toThrow(/UNIQUE/);
  });

  it('lists categories sorted by name, case-insensitively', async () => {
    await repository.save(CategoryMother.create({ id: 'c1', name: 'zoology' }));
    await repository.save(CategoryMother.create({ id: 'c2', name: 'Astronomy' }));
    await repository.save(CategoryMother.create({ id: 'c3', name: 'biology' }));

    const names = (await repository.findAll()).map((category) => category.getName());
    expect(names).toEqual(['Astronomy', 'biology', 'zoology']);
  });

  it('deletes and reports missing ids', async () => {
    await repository.save(CategoryMother.create());

    expect(await repository.delete('category-1')).toBe(true);
    expect(await repository.delete('category-1')).toBe(false);
    expect(await repository.findById('category-1')).toBeNull();
  });
});
