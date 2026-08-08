import { Certificate } from './Certificate';

export interface CertificateExportStrings {
  title: string;
  awardedTo: string;
  completedCourse: string;
  issuedOn: string;
  note: string;
}

export interface CertificateExportContext {
  libraryName: string;
  /** Relative media path (without /api/media prefix) of the logo, if any. */
  logoMediaPath: string | null;
  issuedAtText: string;
  verificationUrl: string;
  strings: CertificateExportStrings;
}

export interface CertificateExportRepository {
  export(certificate: Certificate, context: CertificateExportContext): Promise<Buffer>;
}
