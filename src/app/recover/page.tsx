import { PublicHeader } from '@/components/public/PublicHeader';
import { RecoverForm } from '@/components/auth/RecoverForm';
import styles from '../auth.module.css';

export const dynamic = 'force-dynamic';

export default function RecoverPage() {
  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <RecoverForm />
      </main>
    </>
  );
}
