import Link from 'next/link';
import { notFound } from 'next/navigation';
import newsFactory from '@/modules/news/application/factory';
import settingsFactory from '@/modules/settings/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { PublicHeader } from '@/components/public/PublicHeader';
import { Prose } from '@/components/shared/Prose';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

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

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <article className={`ok-glass ${styles.article}`}>
          <Link href="/news" className={styles.back}>
            ← {translate(dictionary, 'news.title')}
          </Link>
          <time className={styles.date}>
            {new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(post.getCreatedAt())}
          </time>
          <h1 className={styles.title}>{post.getTitle()}</h1>
          <Prose content={post.getMarkdown()} />
        </article>
      </main>
    </>
  );
}
