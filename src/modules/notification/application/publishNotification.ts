import { randomUUID } from 'crypto';
import { Notification, NotificationType } from '../domain/Notification';
import { NotificationRepository } from '../domain/NotificationRepository';

interface publishNotificationProps {
  userId?: string | null;
  type: NotificationType;
  title: string;
  refId?: string | null;
  notificationRepository: NotificationRepository;
}

export async function publishNotification({
  userId,
  type,
  title,
  refId,
  notificationRepository,
}: publishNotificationProps): Promise<Notification> {
  const notification = Notification.create(randomUUID(), userId ?? null, type, title, refId ?? null);
  return await notificationRepository.save(notification);
}
