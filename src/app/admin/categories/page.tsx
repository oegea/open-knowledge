import Link from 'next/link';
import categoryFactory from '@/modules/category/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const categories = await categoryFactory.listCategories();

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{translate(dictionary, 'admin.categories')}</h1>
        <Link href="/admin/categories/new" className={styles.newButton}>
          + {translate(dictionary, 'admin.newCategory')}
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className={`ok-glass ${styles.empty}`}>{translate(dictionary, 'admin.noCategories')}</p>
      ) : (
        <ul className={styles.list}>
          {categories.map((category) => (
            <li key={category.getId()}>
              <Link
                href={`/admin/categories/${category.getId()}`}
                className={`ok-glass ${styles.row}`}
              >
                {category.getImagePath() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={category.getImagePath()!} alt="" className={styles.thumb} />
                ) : (
                  <span className={`${styles.thumb} ${styles.thumbFallback}`} aria-hidden="true" />
                )}
                <span className={styles.rowTitle}>{category.getName()}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
