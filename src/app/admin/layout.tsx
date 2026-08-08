import Link from 'next/link';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import styles from './layout.module.css';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <div className={styles.shell}>
      <header className={`ok-glass-strong ${styles.header}`}>
        <Link href="/" className={styles.brand}>
          {translate(dictionary, 'common.appName')}
        </Link>
        <span className={styles.headerTitle}>{translate(dictionary, 'nav.admin')}</span>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
