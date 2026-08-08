import { Notification } from '../domain/Notification';
import { NotificationRepository } from '../domain/NotificationRepository';

export interface NotificationFeed {
  notifications: Notification[];
  unreadCount: number;
}

interface listNotificationsProps {
  userId: string;
  limit?: number;
  notificationRepository: NotificationRepository;
}

export async function listNotifications({
  userId,
  limit = 50,
  notificationRepository,
}: listNotificationsProps): Promise<NotificationFeed> {
  if (!userId) {
    throw new Error('[listNotifications] User id must be provided');
  }

  const notifications = await notificationRepository.findForUser(userId, limit);
  const seenAt = await notificationRepository.getSeenAt(userId);
  const unreadCount = notifications.filter(
    (notification) => seenAt === null || notification.getCreatedAt() > seenAt
  ).length;

  return { notifications, unreadCount };
}
