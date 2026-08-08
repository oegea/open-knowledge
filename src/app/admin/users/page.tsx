import identityFactory from '@/modules/identity/application/factory';
import { getCurrentUser } from '@/app/serverAuth';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { UsersPanel } from '@/components/admin/UsersPanel';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const [users, currentUser] = await Promise.all([
    identityFactory.listUsers(),
    getCurrentUser(),
  ]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{translate(dictionary, 'admin.users')}</h1>
      <UsersPanel
        currentUserId={currentUser!.getId()!}
        initialUsers={users.map((user) => ({
          id: user.getId()!,
          identifier: user.getIdentifier(),
          displayName: user.getDisplayName(),
          isAdmin: user.isAdmin(),
          createdAt: user.getCreatedAt().toISOString(),
        }))}
      />
    </div>
  );
}
