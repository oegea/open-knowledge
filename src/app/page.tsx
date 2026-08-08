import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import styles from './page.module.css';

export default async function Home() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <main className={styles.main}>
      <section className={`ok-glass ${styles.hero}`}>
        <h1 className={styles.title}>{translate(dictionary, 'common.appName')}</h1>
        <p className={styles.tagline}>{translate(dictionary, 'home.tagline')}</p>
        <p className={styles.description}>{translate(dictionary, 'home.description')}</p>
      </section>
    </main>
  );
}
