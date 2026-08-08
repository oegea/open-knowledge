import { publishNotification } from './publishNotification';
import { listNotifications } from './listNotifications';
import { markNotificationsSeen } from './markNotificationsSeen';
import { deleteNotificationsForUser } from './deleteNotificationsForUser';
import { NotificationType } from '../domain/Notification';
import { SqliteNotificationRepository } from '../infrastructure/SqliteNotificationRepository';

export default {
  publishNotification: async (
    type: NotificationType,
    title: string,
    refId?: string | null,
    userId?: string | null
  ) =>
    await publishNotification({
      type,
      title,
      refId,
      userId,
      notificationRepository: new SqliteNotificationRepository(),
    }),

  listNotifications: async (userId: string) =>
    await listNotifications({
      userId,
      notificationRepository: new SqliteNotificationRepository(),
    }),

  markNotificationsSeen: async (userId: string) =>
    await markNotificationsSeen({
      userId,
      notificationRepository: new SqliteNotificationRepository(),
    }),

  deleteNotificationsForUser: async (userId: string) =>
    await deleteNotificationsForUser({
      userId,
      notificationRepository: new SqliteNotificationRepository(),
    }),
};
