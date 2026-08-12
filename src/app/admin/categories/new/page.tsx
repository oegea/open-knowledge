import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { CategoryEditor } from '@/components/admin/CategoryEditor';
import styles from '../../news/editor.module.css';

export default async function NewCategoryPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <div className={`ok-glass ${styles.panel}`}>
      <h1 className={styles.title}>{translate(dictionary, 'admin.newCategory')}</h1>
      <CategoryEditor />
    </div>
  );
}
