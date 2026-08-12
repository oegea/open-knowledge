import { notFound, permanentRedirect } from 'next/navigation';
import pagesFactory from '@/modules/pages/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Prose } from '@/components/shared/Prose';
import { BackLink } from '@/components/shared/BackLink';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/p/[id]'>) {
  try {
    const { id } = await params;
    const page = await pagesFactory.getPage(id);
    return { title: page.getTitle() };
  } catch {
    return {};
  }
}

export default async function AuxiliaryPage({ params }: PageProps<'/p/[id]'>) {
  const { id } = await params;

  let page;
  try {
    page = await pagesFactory.getPage(id);
  } catch {
    notFound();
  }

  if (page.getSlug() && id !== page.getSlug()) {
    permanentRedirect(`/p/${page.getSlug()}`);
  }

  const dictionary = await getDictionary(await getLocale());

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <article className={`ok-glass ${styles.article}`}>
          <BackLink href="/" label={translate(dictionary, 'nav.library')} />
          <h1 className={styles.title}>{page.getTitle()}</h1>
          <Prose content={page.getMarkdown()} />
        </article>
      </main>
      <PublicFooter />
    </>
  );
}
