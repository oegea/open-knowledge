import { CertificateRepository } from '../domain/CertificateRepository';

interface revokeCertificateProps {
  certificateId: string;
  certificateRepository: CertificateRepository;
}

/**
 * Administrator action: permanently removes an issued certificate. Its
 * verification URL stops resolving, which is exactly what revocation means.
 * The learner can earn it again by completing the course requirements.
 */
export async function revokeCertificate({
  certificateId,
  certificateRepository,
}: revokeCertificateProps): Promise<void> {
  if (!certificateId) {
    throw new Error('[revokeCertificate] Certificate id must be provided');
  }

  const deleted = await certificateRepository.delete(certificateId);
  if (!deleted) {
    throw new Error(`[revokeCertificate] Certificate with id ${certificateId} not found`);
  }
}
