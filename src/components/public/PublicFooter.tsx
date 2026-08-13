import Link from 'next/link';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import settingsFactory from '@/modules/settings/application/factory';
import pagesFactory from '@/modules/pages/application/factory';
import {
  isStaticMode,
  getContentSourceUrl,
} from '@/modules/shared/infrastructure/StaticContentClient';
import styles from './PublicFooter.module.css';

const PROJECT_URL = 'https://github.com/oegea/open-knowledge';

/** Every locale keeps the literal "Open Knowledge" — link that fragment. */
function taglineWithLink(text: string, linkClassName: string) {
  const [before, ...after] = text.split('Open Knowledge');
  return (
    <>
      {before}
      <a href={PROJECT_URL} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        Open Knowledge
      </a>
      {after.join('Open Knowledge')}
    </>
  );
}

export async function PublicFooter() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const settings = await settingsFactory.getInstanceSettings();
  const footerPages = await pagesFactory.listPages('footer');
  const owner = settings.getOwnerName();
  // Static mode serves everything from a public repository — credit the source.
  const sourceUrl = isStaticMode() ? getContentSourceUrl() : null;

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
        {taglineWithLink(
          owner
            ? translate(dictionary, 'footer.taglineOwned', { owner })
            : translate(dictionary, 'footer.tagline'),
          styles.projectLink
        )}
        {sourceUrl ? (
          <>
            {' · '}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.projectLink}
            >
              {translate(dictionary, 'footer.contentSource')}
            </a>
          </>
        ) : null}
      </p>
    </footer>
  );
}
