import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { RegisterForm } from '@/components/auth/RegisterForm';
import styles from '../auth.module.css';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { notFound } from 'next/navigation';
import { isStaticMode } from '@/modules/shared/infrastructure/StaticContentClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const dictionary = await getDictionary(await getLocale());
  return { title: translate(dictionary, 'auth.register') };
}

export default function RegisterPage() {
  if (isStaticMode()) notFound();

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <RegisterForm />
      </main>
      <PublicFooter />
    </>
  );
}
