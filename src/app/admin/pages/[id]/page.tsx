import { notFound } from 'next/navigation';
import pagesFactory from '@/modules/pages/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { PageEditor } from '@/components/admin/PageEditor';
import { DeletePageButton } from '@/components/admin/DeletePageButton';
import styles from '../../news/editor.module.css';

export const dynamic = 'force-dynamic';

export default async function EditAuxiliaryPagePage({ params }: PageProps<'/admin/pages/[id]'>) {
  const { id } = await params;
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  let page;
  try {
    page = await pagesFactory.getPage(id);
  } catch {
    notFound();
  }

  return (
    <div className={`ok-glass ${styles.panel}`}>
      <h1 className={styles.title}>{translate(dictionary, 'common.edit')}</h1>
      <PageEditor initial={page.toPrimitive()} />
      <DeletePageButton pageId={id} />
    </div>
  );
}
