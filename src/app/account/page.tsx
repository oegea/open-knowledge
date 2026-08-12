import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import certificateFactory from '@/modules/certificate/application/factory';
import { getCurrentUser } from '@/app/serverAuth';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { DisplayNameForm } from '@/components/auth/DisplayNameForm';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import styles from './page.module.css';
import { isStaticMode } from '@/modules/shared/infrastructure/StaticContentClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const dictionary = await getDictionary(await getLocale());
  return { title: translate(dictionary, 'auth.myAccount') };
}

export default async function AccountPage() {
  if (isStaticMode()) notFound();

  const user = await getCurrentUser();
  if (user === null) redirect('/login');

  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const certificates = await certificateFactory.listCertificates(user.getId()!);

  return (
    <>
      <PublicHeader backHref="/" />
      <main className={styles.main}>
        <Breadcrumbs
          label={translate(dictionary, 'nav.breadcrumb')}
          items={[
            { href: '/', label: translate(dictionary, 'nav.library') },
            { label: translate(dictionary, 'auth.myAccount') },
          ]}
        />
        <section className={`ok-glass ${styles.identityCard}`}>
          <h1 className={styles.title}>{translate(dictionary, 'auth.myAccount')}</h1>
          <p className={styles.identifier}>{user.getIdentifier()}</p>
          <DisplayNameForm initial={user.getDisplayName()} />
          <div>
            <LogoutButton />
          </div>
        </section>

        <section className={styles.certificates}>
          <h2 className={styles.sectionTitle}>
            {translate(dictionary, 'account.certificates')}
          </h2>
          {certificates.length === 0 ? (
            <p className={`ok-glass ${styles.empty}`}>
              {translate(dictionary, 'account.noCertificates')}
            </p>
          ) : (
            <ul className={styles.certificateList}>
              {certificates.map((certificate) => (
                <li key={certificate.getId()}>
                  <Link
                    href={`/certificates/${certificate.getId()}`}
                    className={`ok-glass ${styles.certificateItem}`}
                  >
                    <span className={styles.certificateIcon} aria-hidden="true">
                      ❦
                    </span>
                    <span className={styles.certificateInfo}>
                      <span className={styles.certificateCourse}>
                        {certificate.getCourseTitle()}
                      </span>
                      <span className={styles.certificateDate}>
                        {new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
                          certificate.getIssuedAt()
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
