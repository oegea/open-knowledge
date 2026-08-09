import { notFound } from 'next/navigation';
import certificateFactory from '@/modules/certificate/application/factory';
import settingsFactory from '@/modules/settings/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import styles from './page.module.css';
import { isStaticMode } from '@/modules/shared/infrastructure/StaticContentClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const dictionary = await getDictionary(await getLocale());
  return { title: translate(dictionary, 'certificate.title') };
}

export default async function CertificatePage({ params }: PageProps<'/certificates/[id]'>) {
  if (isStaticMode()) notFound();

  const { id } = await params;
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const settings = await settingsFactory.getInstanceSettings();

  let certificate;
  try {
    certificate = await certificateFactory.getCertificate(id);
  } catch {
    notFound();
  }

  const issuedAt = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
    certificate.getIssuedAt()
  );

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <article className={`ok-glass-strong ${styles.certificate}`}>
          <div className={styles.ornamentTop} aria-hidden="true" />
          {settings.getCertificateLogoPath() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.getCertificateLogoPath()!}
              alt={settings.getLibraryName()}
              className={styles.libraryLogo}
            />
          ) : (
            <p className={styles.library}>{settings.getLibraryName()}</p>
          )}
          <h1 className={styles.title}>{translate(dictionary, 'certificate.title')}</h1>

          <p className={styles.awardedTo}>{translate(dictionary, 'certificate.awardedTo')}</p>
          <p className={styles.identity}>{certificate.getHolderName()}</p>
          {certificate.getDisplayName() ? (
            <p className={styles.identitySignature}>{certificate.getIdentifier()}</p>
          ) : null}

          <p className={styles.completed}>
            {translate(dictionary, 'certificate.completedCourse')}
          </p>
          <p className={styles.courseTitle}>{certificate.getCourseTitle()}</p>

          <p className={styles.issued}>
            {translate(dictionary, 'certificate.issuedOn')} {issuedAt}
          </p>

          <p className={styles.note}>{translate(dictionary, 'certificate.note')}</p>
          <p className={styles.certificateId}>{certificate.getId()}</p>
          <a
            href={`/api/certificates/${certificate.getId()}/pdf`}
            className={styles.downloadButton}
            download
          >
            ↓ {translate(dictionary, 'course.downloadPdf')}
          </a>
          <div className={styles.ornamentBottom} aria-hidden="true" />
        </article>
      </main>
      <PublicFooter />
    </>
  );
}
