import { Notification } from './Notification';

export interface NotificationRepository {
  save(notification: Notification): Promise<Notification>;
  /** Broadcast notifications plus the user's personal ones, newest first. */
  findForUser(userId: string, limit: number): Promise<Notification[]>;
  getSeenAt(userId: string): Promise<Date | null>;
  markSeen(userId: string, at: Date): Promise<void>;
  /** Removes the user's personal notifications (broadcasts stay). */
  deleteForUser(userId: string): Promise<void>;
}
