import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { RecoverForm } from '@/components/auth/RecoverForm';
import styles from '../auth.module.css';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const dictionary = await getDictionary(await getLocale());
  return { title: translate(dictionary, 'auth.recoveryTitle') };
}

export default function RecoverPage() {
  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <RecoverForm />
      </main>
      <PublicFooter />
    </>
  );
}
