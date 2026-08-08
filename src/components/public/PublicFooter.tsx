import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import settingsFactory from '@/modules/settings/application/factory';
import styles from './PublicFooter.module.css';

export async function PublicFooter() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const settings = await settingsFactory.getInstanceSettings();
  const owner = settings.getOwnerName();

  return (
    <footer className={styles.footer}>
      <span className={styles.mark} aria-hidden="true">
        ✦
      </span>
      <p className={styles.text}>
        {owner
          ? translate(dictionary, 'footer.taglineOwned', { owner })
          : translate(dictionary, 'footer.tagline')}
      </p>
    </footer>
  );
}
