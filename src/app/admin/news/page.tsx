import Link from 'next/link';
import newsFactory from '@/modules/news/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const posts = await newsFactory.listNewsPosts(false);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{translate(dictionary, 'admin.news')}</h1>
        <Link href="/admin/news/new" className={styles.newButton}>
          + {translate(dictionary, 'admin.newPost')}
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className={`ok-glass ${styles.empty}`}>{translate(dictionary, 'news.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.getId()}>
              <Link href={`/admin/news/${post.getId()}`} className={`ok-glass ${styles.post}`}>
                <span className={styles.postInfo}>
                  <span className={styles.postTitle}>{post.getTitle()}</span>
                  <time className={styles.postDate}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                      post.getCreatedAt()
                    )}
                  </time>
                </span>
                <span className={post.isPublished() ? styles.badgePublished : styles.badgeDraft}>
                  {translate(dictionary, post.isPublished() ? 'admin.published' : 'admin.draft')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
