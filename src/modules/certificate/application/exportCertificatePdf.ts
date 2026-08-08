import { CertificateRepository } from '../domain/CertificateRepository';
import {
  CertificateExportRepository,
  CertificateExportStrings,
} from '../domain/CertificateExportRepository';
import { SettingsRepository } from '../../settings/domain/SettingsRepository';

export interface CertificatePdfResult {
  data: Buffer;
  filename: string;
}

interface exportCertificatePdfProps {
  certificateId: string;
  baseUrl: string;
  /** Localized copy plus a pre-formatted issue date. */
  strings: CertificateExportStrings;
  issuedAtText: (issuedAt: Date) => string;
  certificateRepository: CertificateRepository;
  settingsRepository: SettingsRepository;
  exportRepository: CertificateExportRepository;
}

export async function exportCertificatePdf({
  certificateId,
  baseUrl,
  strings,
  issuedAtText,
  certificateRepository,
  settingsRepository,
  exportRepository,
}: exportCertificatePdfProps): Promise<CertificatePdfResult> {
  if (!certificateId) {
    throw new Error('[exportCertificatePdf] Certificate id must be provided');
  }

  const certificate = await certificateRepository.findById(certificateId);
  if (certificate === null) {
    throw new Error(`[exportCertificatePdf] Certificate with id ${certificateId} not found`);
  }

  const settings = await settingsRepository.get();
  const logo = settings.getCertificateLogoPath();

  const data = await exportRepository.export(certificate, {
    libraryName: settings.getLibraryName(),
    logoMediaPath: logo ? logo.replace(/^\/api\/media\//, '') : null,
    issuedAtText: issuedAtText(certificate.getIssuedAt()),
    verificationUrl: `${baseUrl}/certificates/${certificateId}`,
    strings,
  });

  return { data, filename: `certificate-${certificateId}.pdf` };
}
