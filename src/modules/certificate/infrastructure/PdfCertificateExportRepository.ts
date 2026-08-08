import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import path from 'path';
import { Certificate } from '../domain/Certificate';
import {
  CertificateExportRepository,
  CertificateExportContext,
} from '../domain/CertificateExportRepository';
import { MediaRepository } from '../../media/domain/MediaRepository';
import { FilesystemMediaRepository } from '../../media/infrastructure/FilesystemMediaRepository';

const TEAL = '#0e7c86';
const AMBER = '#c97e0e';
const INK = '#131a21';
const MUTED = '#66757f';

export class PdfCertificateExportRepository implements CertificateExportRepository {
  constructor(private readonly mediaRepository: MediaRepository = new FilesystemMediaRepository()) {}

  async export(certificate: Certificate, context: CertificateExportContext): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 56, bottom: 56, left: 72, right: 72 },
      info: { Title: context.strings.title, Creator: 'Open Knowledge' },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const finished = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    );

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Brand frame: gradient-like double rule top and bottom.
    doc.rect(0, 0, pageWidth, 8).fill(TEAL);
    doc.rect(0, 8, pageWidth, 3).fill(AMBER);
    doc.rect(0, pageHeight - 11, pageWidth, 3).fill(AMBER);
    doc.rect(0, pageHeight - 8, pageWidth, 8).fill(TEAL);

    doc.y = 84;

    const logo = await this.loadRasterImage(context.logoMediaPath);
    if (logo) {
      doc.image(logo, pageWidth / 2 - 56, doc.y, { fit: [112, 52], align: 'center' });
      doc.y += 68;
    } else {
      doc.font('Helvetica-Bold').fontSize(13).fillColor(TEAL);
      doc.text(context.libraryName.toUpperCase(), { align: 'center', characterSpacing: 2 });
      doc.moveDown(1.2);
    }

    doc.font('Helvetica').fontSize(20).fillColor(MUTED);
    doc.text(context.strings.title, { align: 'center' });
    doc.moveDown(0.8);

    doc.fontSize(12).fillColor(MUTED);
    doc.text(context.strings.awardedTo, { align: 'center' });
    doc.moveDown(0.3);

    doc.font('Helvetica-Bold').fontSize(32).fillColor(INK);
    doc.text(certificate.getHolderName(), { align: 'center' });

    // The pseudonymous identity stays visible as the verifiable signature.
    if (certificate.getDisplayName()) {
      doc.moveDown(0.2);
      doc.font('Courier').fontSize(10).fillColor(MUTED);
      doc.text(certificate.getIdentifier(), { align: 'center' });
    }
    doc.moveDown(0.8);

    doc.font('Helvetica').fontSize(12).fillColor(MUTED);
    doc.text(context.strings.completedCourse, { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Helvetica-BoldOblique').fontSize(20).fillColor(TEAL);
    doc.text(certificate.getCourseTitle(), { align: 'center' });
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(11).fillColor(INK);
    doc.text(`${context.strings.issuedOn} ${context.issuedAtText}`, { align: 'center' });
    doc.moveDown(1.2);

    doc.fontSize(8.5).fillColor(MUTED);
    doc.text(context.strings.note, pageWidth / 2 - 200, doc.y, {
      align: 'center',
      width: 400,
    });
    doc.moveDown(0.6);
    // Explicit-x text above shifts the current box; reset to full width so
    // the centered URL is truly centered.
    doc.font('Courier').fontSize(8);
    doc.text(context.verificationUrl, doc.page.margins.left, doc.y, {
      align: 'center',
      width: pageWidth - doc.page.margins.left - doc.page.margins.right,
      link: context.verificationUrl,
    });

    doc.end();
    return await finished;
  }

  private async loadRasterImage(mediaPath: string | null): Promise<Buffer | null> {
    if (!mediaPath) return null;
    const stored = await this.mediaRepository.retrieve(mediaPath);
    if (!stored) return null;
    const extension = path.extname(mediaPath).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(extension)) return stored.data;
    try {
      return await sharp(stored.data, { density: 192 }).png().toBuffer();
    } catch {
      return null;
    }
  }
}
