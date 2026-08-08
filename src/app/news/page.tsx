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

export async function generateMetadata() {
  const dictionary = await getDictionary(await getLocale());
  return { title: translate(dictionary, 'news.title') };
}

export default async function NewsPage() {
  const settings = await settingsFactory.getInstanceSettings();
  if (!settings.isNewsEnabled()) notFound();

  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const posts = await newsFactory.listNewsPosts(true);
  const [featured, ...rest] = posts;

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);

  const meta = (post: (typeof posts)[number]) => (
    <span className={styles.meta}>
      <time className={styles.date}>{formatDate(post.getCreatedAt())}</time>
      {post.getAuthor() ? (
        <span className={styles.author}>
          {translate(dictionary, 'news.byAuthor', { author: post.getAuthor() })}
        </span>
      ) : null}
    </span>
  );

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <h1 className={styles.title}>{translate(dictionary, 'news.title')}</h1>

        {posts.length === 0 ? (
          <p className={`ok-glass ${styles.empty}`}>{translate(dictionary, 'news.empty')}</p>
        ) : (
          <>
            {/* The latest post opens the page as a featured story. */}
            <Link
              href={`/news/${featured.getSlug() || featured.getId()}`}
              className={`ok-glass ${styles.featured}`}
            >
              {featured.getImagePath() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.getImagePath()!}
                  alt=""
                  className={styles.featuredImage}
                />
              ) : (
                <span className={styles.featuredFallback} aria-hidden="true" />
              )}
              <span className={styles.featuredScrim} aria-hidden="true" />
              <span className={styles.featuredBody}>
                {meta(featured)}
                <span className={styles.featuredTitle}>{featured.getTitle()}</span>
                <span className={styles.readMore}>
                  {translate(dictionary, 'news.readMore')} →
                </span>
              </span>
            </Link>

            {rest.length > 0 ? (
              <ul className={styles.grid}>
                {rest.map((post) => (
                  <li key={post.getId()}>
                    <Link
                      href={`/news/${post.getSlug() || post.getId()}`}
                      className={`ok-glass ${styles.post}`}
                    >
                      {post.getImagePath() ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.getImagePath()!}
                          alt=""
                          className={styles.postImage}
                          loading="lazy"
                        />
                      ) : (
                        <span className={styles.postImageFallback} aria-hidden="true" />
                      )}
                      <span className={styles.postBody}>
                        {meta(post)}
                        <span className={styles.postTitle}>{post.getTitle()}</span>
                        <span className={styles.readMore}>
                          {translate(dictionary, 'news.readMore')} →
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
