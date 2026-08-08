import type { Database } from 'better-sqlite3';
import { Certificate } from '../domain/Certificate';
import { CertificateRepository } from '../domain/CertificateRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

interface CertificateRow {
  id: string;
  user_id: string;
  course_id: string;
  course_title: string;
  identifier: string;
  issued_at: string;
}

export class SqliteCertificateRepository implements CertificateRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async save(certificate: Certificate): Promise<Certificate> {
    const data = certificate.toPrimitive();
    if (!data.id) {
      throw new Error('[SqliteCertificateRepository] cannot save a certificate without id');
    }

    this.db
      .prepare(
        `INSERT INTO certificates (id, user_id, course_id, course_title, identifier, issued_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(data.id, data.userId, data.courseId, data.courseTitle, data.identifier, data.issuedAt);

    return certificate;
  }

  async findById(id: string): Promise<Certificate | null> {
    const row = this.db.prepare('SELECT * FROM certificates WHERE id = ?').get(id) as
      | CertificateRow
      | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<Certificate | null> {
    const row = this.db
      .prepare('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?')
      .get(userId, courseId) as CertificateRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findByUser(userId: string): Promise<Certificate[]> {
    const rows = this.db
      .prepare('SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC')
      .all(userId) as CertificateRow[];
    return rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: CertificateRow): Certificate {
    return Certificate.fromPrimitive({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      courseTitle: row.course_title,
      identifier: row.identifier,
      issuedAt: row.issued_at,
    });
  }
}
