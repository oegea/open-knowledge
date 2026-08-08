import { NotificationRepository } from '../domain/NotificationRepository';

interface markNotificationsSeenProps {
  userId: string;
  notificationRepository: NotificationRepository;
}

export async function markNotificationsSeen({
  userId,
  notificationRepository,
}: markNotificationsSeenProps): Promise<void> {
  if (!userId) {
    throw new Error('[markNotificationsSeen] User id must be provided');
  }

  await notificationRepository.markSeen(userId, new Date());
}
