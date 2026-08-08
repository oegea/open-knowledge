import { Certificate } from '../domain/Certificate';
import { CertificateRepository } from '../domain/CertificateRepository';

interface getCertificateProps {
  id: string;
  certificateRepository: CertificateRepository;
}

export async function getCertificate({
  id,
  certificateRepository,
}: getCertificateProps): Promise<Certificate> {
  if (!id) {
    throw new Error('[getCertificate] Id must be provided');
  }

  const certificate = await certificateRepository.findById(id);
  if (certificate === null) {
    throw new Error(`[getCertificate] Certificate with id ${id} not found`);
  }

  return certificate;
}
