import { issueCertificate } from './issueCertificate';
import { getCertificate } from './getCertificate';
import { listCertificates } from './listCertificates';
import { SqliteCertificateRepository } from '../infrastructure/SqliteCertificateRepository';
import { SqliteCourseRepository } from '../../course/infrastructure/SqliteCourseRepository';
import { SqliteProgressRepository } from '../../study/infrastructure/SqliteProgressRepository';
import { SqliteExamResultRepository } from '../../assessment/infrastructure/SqliteExamResultRepository';

export default {
  issueCertificate: async (userId: string, identifier: string, courseId: string) =>
    await issueCertificate({
      userId,
      identifier,
      courseId,
      courseRepository: new SqliteCourseRepository(),
      progressRepository: new SqliteProgressRepository(userId),
      examResultRepository: new SqliteExamResultRepository(),
      certificateRepository: new SqliteCertificateRepository(),
    }),

  getCertificate: async (id: string) =>
    await getCertificate({ id, certificateRepository: new SqliteCertificateRepository() }),

  listCertificates: async (userId: string) =>
    await listCertificates({ userId, certificateRepository: new SqliteCertificateRepository() }),
};
