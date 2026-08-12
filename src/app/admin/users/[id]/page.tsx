import { notFound } from 'next/navigation';
import identityFactory from '@/modules/identity/application/factory';
import certificateFactory from '@/modules/certificate/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { UserDetailPanel } from '@/components/admin/UserDetailPanel';
import { BackLink } from '@/components/shared/BackLink';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({ params }: PageProps<'/admin/users/[id]'>) {
  const { id } = await params;
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  const user = await identityFactory.getUser(id);
  if (!user) notFound();

  const certificates = await certificateFactory.listCertificates(id);

  return (
    <div className={styles.page}>
      <BackLink href="/admin/users" label={translate(dictionary, 'admin.users')} />
      <h1 className={styles.title}>{user.getIdentifier()}</h1>
      <UserDetailPanel
        user={{
          id: user.getId()!,
          identifier: user.getIdentifier(),
          displayName: user.getDisplayName(),
          isAdmin: user.isAdmin(),
          createdAt: user.getCreatedAt().toISOString(),
        }}
        initialCertificates={certificates.map((certificate) => ({
          id: certificate.getId()!,
          courseTitle: certificate.getCourseTitle(),
          holderName: certificate.getHolderName(),
          issuedAt: certificate.getIssuedAt().toISOString(),
        }))}
      />
    </div>
  );
}
