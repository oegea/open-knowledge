import { notFound } from 'next/navigation';
import categoryFactory from '@/modules/category/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { CategoryEditor } from '@/components/admin/CategoryEditor';
import { DeleteCategoryButton } from '@/components/admin/DeleteCategoryButton';
import styles from '../../news/editor.module.css';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({ params }: PageProps<'/admin/categories/[id]'>) {
  const { id } = await params;
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  let category;
  try {
    category = await categoryFactory.getCategory(id);
  } catch {
    notFound();
  }

  return (
    <div className={`ok-glass ${styles.panel}`}>
      <h1 className={styles.title}>{translate(dictionary, 'common.edit')}</h1>
      <CategoryEditor initial={category.toPrimitive()} />
      <DeleteCategoryButton categoryId={id} />
    </div>
  );
}
