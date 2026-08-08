import { PublicHeader } from '@/components/public/PublicHeader';
import { RegisterForm } from '@/components/auth/RegisterForm';
import styles from '../auth.module.css';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <RegisterForm />
      </main>
    </>
  );
}
