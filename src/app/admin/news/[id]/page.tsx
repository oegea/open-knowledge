import { notFound } from 'next/navigation';
import newsFactory from '@/modules/news/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { NewsEditor } from '@/components/admin/NewsEditor';
import { DeleteNewsButton } from '@/components/admin/DeleteNewsButton';
import styles from '../editor.module.css';

export const dynamic = 'force-dynamic';

export default async function EditNewsPostPage({ params }: PageProps<'/admin/news/[id]'>) {
  const { id } = await params;
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  let post;
  try {
    post = await newsFactory.getNewsPost(id);
  } catch {
    notFound();
  }

  return (
    <div className={`ok-glass ${styles.panel}`}>
      <h1 className={styles.title}>{translate(dictionary, 'common.edit')}</h1>
      <NewsEditor initial={post.toPrimitive()} />
      <DeleteNewsButton postId={id} />
    </div>
  );
}
