import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { NewsEditor } from '@/components/admin/NewsEditor';
import styles from '../editor.module.css';

export default async function NewNewsPostPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <div className={`ok-glass ${styles.panel}`}>
      <h1 className={styles.title}>{translate(dictionary, 'admin.newPost')}</h1>
      <NewsEditor />
    </div>
  );
}
