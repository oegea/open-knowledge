import type { Database } from 'better-sqlite3';
import { Notification, NotificationType } from '../domain/Notification';
import { NotificationRepository } from '../domain/NotificationRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

interface NotificationRow {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  ref_id: string | null;
  created_at: string;
}

export class SqliteNotificationRepository implements NotificationRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async save(notification: Notification): Promise<Notification> {
    const data = notification.toPrimitive();
    if (!data.id) {
      throw new Error('[SqliteNotificationRepository] cannot save a notification without id');
    }

    this.db
      .prepare(
        `INSERT INTO notifications (id, user_id, type, title, ref_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(data.id, data.userId, data.type, data.title, data.refId, data.createdAt);

    return notification;
  }

  async findForUser(userId: string, limit: number): Promise<Notification[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM notifications
         WHERE user_id IS NULL OR user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(userId, limit) as NotificationRow[];

    return rows.map((row) =>
      Notification.fromPrimitive({
        id: row.id,
        userId: row.user_id,
        type: row.type as NotificationType,
        title: row.title,
        refId: row.ref_id,
        createdAt: row.created_at,
      })
    );
  }

  async getSeenAt(userId: string): Promise<Date | null> {
    const row = this.db
      .prepare('SELECT seen_at FROM notification_state WHERE user_id = ?')
      .get(userId) as { seen_at: string } | undefined;
    return row ? new Date(row.seen_at) : null;
  }

  async markSeen(userId: string, at: Date): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO notification_state (user_id, seen_at) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET seen_at = excluded.seen_at`
      )
      .run(userId, at.toISOString());
  }

  async deleteForUser(userId: string): Promise<void> {
    // The notifications table has no foreign key (broadcast rows have a
    // NULL user_id), so personal rows are removed explicitly.
    this.db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
  }
}
