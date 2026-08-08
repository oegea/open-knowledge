import { issueCertificate } from './issueCertificate';
import { getCertificate } from './getCertificate';
import { listCertificates } from './listCertificates';
import { exportCertificatePdf } from './exportCertificatePdf';
import { SqliteCertificateRepository } from '../infrastructure/SqliteCertificateRepository';
import { PdfCertificateExportRepository } from '../infrastructure/PdfCertificateExportRepository';
import { SqliteSettingsRepository } from '../../settings/infrastructure/SqliteSettingsRepository';
import { getDictionary, translate } from '@/i18n/dictionary';
import { type Locale } from '@/i18n/config';
import { SqliteCourseRepository } from '../../course/infrastructure/SqliteCourseRepository';
import { SqliteProgressRepository } from '../../study/infrastructure/SqliteProgressRepository';
import { SqliteExamResultRepository } from '../../assessment/infrastructure/SqliteExamResultRepository';
import notificationFactory from '../../notification/application/factory';

export default {
  updateCertificateHolderName: async (userId: string, displayName: string) => {
    await new SqliteCertificateRepository().updateDisplayNameForUser(userId, displayName);
  },

  issueCertificate: async (
    userId: string,
    identifier: string,
    displayName: string,
    courseId: string
  ) =>
    await issueCertificate({
      userId,
      identifier,
      displayName,
      courseId,
      courseRepository: new SqliteCourseRepository(),
      progressRepository: new SqliteProgressRepository(userId),
      examResultRepository: new SqliteExamResultRepository(),
      certificateRepository: new SqliteCertificateRepository(),
      onCertificateIssued: async (certificate) => {
        await notificationFactory.publishNotification(
          'certificate_issued',
          certificate.getCourseTitle(),
          certificate.getId(),
          certificate.getUserId()
        );
      },
    }),

  exportCertificatePdf: async (id: string, baseUrl: string, locale: Locale) => {
    const dictionary = await getDictionary(locale);
    return await exportCertificatePdf({
      certificateId: id,
      baseUrl,
      strings: {
        title: translate(dictionary, 'certificate.title'),
        awardedTo: translate(dictionary, 'certificate.awardedTo'),
        completedCourse: translate(dictionary, 'certificate.completedCourse'),
        issuedOn: translate(dictionary, 'certificate.issuedOn'),
        note: translate(dictionary, 'certificate.note'),
      },
      issuedAtText: (issuedAt) =>
        new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(issuedAt),
      certificateRepository: new SqliteCertificateRepository(),
      settingsRepository: new SqliteSettingsRepository(),
      exportRepository: new PdfCertificateExportRepository(),
    });
  },

  getCertificate: async (id: string) =>
    await getCertificate({ id, certificateRepository: new SqliteCertificateRepository() }),

  listCertificates: async (userId: string) =>
    await listCertificates({ userId, certificateRepository: new SqliteCertificateRepository() }),
};
