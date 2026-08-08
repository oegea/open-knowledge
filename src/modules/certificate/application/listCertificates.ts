import { Certificate } from '../domain/Certificate';
import { CertificateRepository } from '../domain/CertificateRepository';

interface listCertificatesProps {
  userId: string;
  certificateRepository: CertificateRepository;
}

export async function listCertificates({
  userId,
  certificateRepository,
}: listCertificatesProps): Promise<Certificate[]> {
  if (!userId) {
    throw new Error('[listCertificates] User id must be provided');
  }

  return await certificateRepository.findByUser(userId);
}
