import { Certificate } from './Certificate';

export interface CertificateRepository {
  save(certificate: Certificate): Promise<Certificate>;
  findById(id: string): Promise<Certificate | null>;
  findByUserAndCourse(userId: string, courseId: string): Promise<Certificate | null>;
  findByUser(userId: string): Promise<Certificate[]>;
  /** Keeps issued certificates in sync when the learner renames themselves. */
  updateDisplayNameForUser(userId: string, displayName: string): Promise<void>;
}
