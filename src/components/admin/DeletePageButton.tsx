'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';

export function DeletePageButton({ pageId }: { pageId: string }) {
  const { t } = useI18n();
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    await fetch(`/api/pages/${pageId}`, { method: 'DELETE' });
    router.push('/admin/pages');
    router.refresh();
  };

  return (
    <Button variant="danger" size="sm" onClick={handleDelete}>
      {t('common.delete')}
    </Button>
  );
}
