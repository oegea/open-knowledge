import Link from 'next/link';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import settingsFactory from '@/modules/settings/application/factory';
import pagesFactory from '@/modules/pages/application/factory';
import styles from './PublicFooter.module.css';

export async function PublicFooter() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const settings = await settingsFactory.getInstanceSettings();
  const footerPages = await pagesFactory.listPages('footer');
  const owner = settings.getOwnerName();

  return (
    <footer className={styles.footer}>
      {footerPages.length > 0 ? (
        <nav className={styles.links}>
          {footerPages.map((page) => (
            <Link key={page.getId()} href={`/p/${page.getSlug() || page.getId()}`} className={styles.link}>
              {page.getTitle()}
            </Link>
          ))}
        </nav>
      ) : null}
      <p className={styles.text}>
        <span className={styles.mark} aria-hidden="true">
          ✦
        </span>{' '}
        {owner
          ? translate(dictionary, 'footer.taglineOwned', { owner })
          : translate(dictionary, 'footer.tagline')}
      </p>
    </footer>
  );
}
