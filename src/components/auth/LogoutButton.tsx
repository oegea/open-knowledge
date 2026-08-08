'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';

export function LogoutButton() {
  const { t } = useI18n();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/identity/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <Button variant="soft" size="sm" onClick={handleLogout}>
      {t('nav.signOut')}
    </Button>
  );
}
