import type { Database } from 'better-sqlite3';
import { CourseProgress } from '../domain/CourseProgress';
import { ProgressRepository } from '../domain/ProgressRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

interface ProgressRow {
  course_id: string;
  completed_material_ids: string;
  last_material_id: string | null;
}

/** Server-side study progress for a registered user. */
export class SqliteProgressRepository implements ProgressRepository {
  private readonly db: Database;

  constructor(private readonly userId: string, db?: Database) {
    this.db = db ?? getDatabase();
  }

  async getProgress(courseId: string): Promise<CourseProgress> {
    const row = this.db
      .prepare('SELECT * FROM progress WHERE user_id = ? AND course_id = ?')
      .get(this.userId, courseId) as ProgressRow | undefined;

    if (!row) return CourseProgress.create(courseId);
    return CourseProgress.fromPrimitive({
      courseId: row.course_id,
      completedMaterialIds: JSON.parse(row.completed_material_ids),
      lastMaterialId: row.last_material_id,
    });
  }

  async saveProgress(progress: CourseProgress): Promise<void> {
    const data = progress.toPrimitive();
    this.db
      .prepare(
        `INSERT INTO progress (user_id, course_id, completed_material_ids, last_material_id)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, course_id) DO UPDATE SET
           completed_material_ids = excluded.completed_material_ids,
           last_material_id = excluded.last_material_id`
      )
      .run(this.userId, data.courseId, JSON.stringify(data.completedMaterialIds), data.lastMaterialId);
  }
}
