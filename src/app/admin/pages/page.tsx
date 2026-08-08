import Link from 'next/link';
import pagesFactory from '@/modules/pages/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import styles from '../news/page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const pages = await pagesFactory.listPages();

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{translate(dictionary, 'admin.pages')}</h1>
        <Link href="/admin/pages/new" className={styles.newButton}>
          + {translate(dictionary, 'admin.newPage')}
        </Link>
      </div>

      {pages.length === 0 ? (
        <p className={`ok-glass ${styles.empty}`}>{translate(dictionary, 'admin.noPages')}</p>
      ) : (
        <ul className={styles.list}>
          {pages.map((page) => (
            <li key={page.getId()}>
              <Link href={`/admin/pages/${page.getId()}`} className={`ok-glass ${styles.post}`}>
                <span className={styles.postInfo}>
                  <span className={styles.postTitle}>{page.getTitle()}</span>
                  <span className={styles.postDate}>
                    {translate(dictionary, `placement.${page.getPlacement()}`)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
