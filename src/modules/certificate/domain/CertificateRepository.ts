import { Certificate } from './Certificate';

export interface CertificateRepository {
  save(certificate: Certificate): Promise<Certificate>;
  findById(id: string): Promise<Certificate | null>;
  findByUserAndCourse(userId: string, courseId: string): Promise<Certificate | null>;
  findByUser(userId: string): Promise<Certificate[]>;
}
