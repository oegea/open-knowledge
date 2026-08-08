import { PublicHeader } from '@/components/public/PublicHeader';
import { LoginForm } from '@/components/auth/LoginForm';
import styles from '../auth.module.css';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <LoginForm />
      </main>
    </>
  );
}
