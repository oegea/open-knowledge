import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { getCurrentUser } from '@/app/serverAuth';
import identityFactory from '@/modules/identity/application/factory';
import styles from './layout.module.css';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const user = await getCurrentUser();
  if (!user?.isAdmin()) {
    // A fresh instance has no accounts yet: the first registration bootstraps
    // the administrator (ADR 0011).
    redirect((await identityFactory.hasUsers()) ? '/login' : '/register');
  }

  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <div className={styles.shell}>
      <header className={`ok-glass-strong ${styles.header}`}>
        <Link href="/" className={styles.brand}>
          {translate(dictionary, 'common.appName')}
        </Link>
        <nav className={styles.headerNav}>
          <Link href="/admin" className={styles.headerLink}>
            {translate(dictionary, 'admin.courses')}
          </Link>
          <Link href="/admin/settings" className={styles.headerLink}>
            {translate(dictionary, 'admin.settings')}
          </Link>
        </nav>
        <span className={styles.headerTitle}>{translate(dictionary, 'nav.admin')}</span>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
