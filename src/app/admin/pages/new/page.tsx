import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { PageEditor } from '@/components/admin/PageEditor';
import styles from '../../news/editor.module.css';

export default async function NewAuxiliaryPagePage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <div className={`ok-glass ${styles.panel}`}>
      <h1 className={styles.title}>{translate(dictionary, 'admin.newPage')}</h1>
      <PageEditor />
    </div>
  );
}
