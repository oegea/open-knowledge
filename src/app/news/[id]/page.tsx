import { notFound, permanentRedirect } from 'next/navigation';
import newsFactory from '@/modules/news/application/factory';
import settingsFactory from '@/modules/settings/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Prose } from '@/components/shared/Prose';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/news/[id]'>) {
  try {
    const { id } = await params;
    const post = await newsFactory.getNewsPost(id);
    return post.isPublished() ? { title: post.getTitle() } : {};
  } catch {
    return {};
  }
}

export default async function NewsPostPage({ params }: PageProps<'/news/[id]'>) {
  const settings = await settingsFactory.getInstanceSettings();
  if (!settings.isNewsEnabled()) notFound();

  const { id } = await params;
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  let post;
  try {
    post = await newsFactory.getNewsPost(id);
  } catch {
    notFound();
  }
  if (!post.isPublished()) notFound();

  if (post.getSlug() && id !== post.getSlug()) {
    permanentRedirect(`/news/${post.getSlug()}`);
  }

  return (
    <>
      <PublicHeader backHref="/news" />
      <main className={styles.main}>
        <article className={`ok-glass ${styles.article}`}>
          {post.getImagePath() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.getImagePath()!} alt="" className={styles.featuredImage} />
          ) : null}
          <p className={styles.meta}>
            <time className={styles.date}>
              {new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(post.getCreatedAt())}
            </time>
            {post.getAuthor() ? (
              <span className={styles.author}>
                {translate(dictionary, 'news.byAuthor', { author: post.getAuthor() })}
              </span>
            ) : null}
          </p>
          <h1 className={styles.title}>{post.getTitle()}</h1>
          <Prose content={post.getMarkdown()} />
        </article>
      </main>
      <PublicFooter />
    </>
  );
}
