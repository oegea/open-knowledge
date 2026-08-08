import Link from 'next/link';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { LanguageSelector } from './LanguageSelector';
import styles from './PublicHeader.module.css';

export async function PublicHeader() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <header className={`ok-glass-strong ${styles.header}`}>
      <Link href="/" className={styles.brand}>
        Open Knowledge
      </Link>
      <nav className={styles.nav} aria-label={translate(dictionary, 'nav.library')}>
        <LanguageSelector />
      </nav>
    </header>
  );
}
