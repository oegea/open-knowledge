import Link from 'next/link';
import { notFound } from 'next/navigation';
import newsFactory from '@/modules/news/application/factory';
import settingsFactory from '@/modules/settings/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const settings = await settingsFactory.getInstanceSettings();
  if (!settings.isNewsEnabled()) notFound();

  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const posts = await newsFactory.listNewsPosts(true);

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <h1 className={styles.title}>{translate(dictionary, 'news.title')}</h1>

        {posts.length === 0 ? (
          <p className={`ok-glass ${styles.empty}`}>{translate(dictionary, 'news.empty')}</p>
        ) : (
          <ul className={styles.list}>
            {posts.map((post) => (
              <li key={post.getId()}>
                <Link href={`/news/${post.getId()}`} className={`ok-glass ${styles.post}`}>
                  <time className={styles.date}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
                      post.getCreatedAt()
                    )}
                  </time>
                  <span className={styles.postTitle}>{post.getTitle()}</span>
                  <span className={styles.readMore}>
                    {translate(dictionary, 'news.readMore')} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
