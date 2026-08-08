import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { LoginForm } from '@/components/auth/LoginForm';
import styles from '../auth.module.css';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const dictionary = await getDictionary(await getLocale());
  return { title: translate(dictionary, 'auth.signIn') };
}

export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <LoginForm />
      </main>
      <PublicFooter />
    </>
  );
}
