import type { Database } from 'better-sqlite3';
import { ExamResult } from '../domain/ExamResult';
import { ExamResultRepository } from '../domain/ExamResultRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

interface ExamResultRow {
  id: string;
  user_id: string;
  course_id: string;
  material_id: string;
  correct_count: number;
  total_count: number;
  score: number;
  passed: number;
  created_at: string;
}

export class SqliteExamResultRepository implements ExamResultRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async save(result: ExamResult): Promise<ExamResult> {
    const data = result.toPrimitive();
    if (!data.id) {
      throw new Error('[SqliteExamResultRepository] cannot save a result without id');
    }

    this.db
      .prepare(
        `INSERT INTO exam_results (id, user_id, course_id, material_id, correct_count, total_count, score, passed, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.id,
        data.userId,
        data.courseId,
        data.materialId,
        data.correctCount,
        data.totalCount,
        data.score,
        data.passed ? 1 : 0,
        data.createdAt
      );

    return result;
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<ExamResult[]> {
    const rows = this.db
      .prepare(
        'SELECT * FROM exam_results WHERE user_id = ? AND course_id = ? ORDER BY created_at DESC'
      )
      .all(userId, courseId) as ExamResultRow[];
    return rows.map((row) => this.mapRow(row));
  }

  async hasPassed(userId: string, courseId: string, materialId: string): Promise<boolean> {
    const row = this.db
      .prepare(
        'SELECT COUNT(*) AS count FROM exam_results WHERE user_id = ? AND course_id = ? AND material_id = ? AND passed = 1'
      )
      .get(userId, courseId, materialId) as { count: number };
    return row.count > 0;
  }

  private mapRow(row: ExamResultRow): ExamResult {
    return ExamResult.fromPrimitive({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      materialId: row.material_id,
      correctCount: row.correct_count,
      totalCount: row.total_count,
      score: row.score,
      passed: row.passed === 1,
      createdAt: row.created_at,
    });
  }
}
