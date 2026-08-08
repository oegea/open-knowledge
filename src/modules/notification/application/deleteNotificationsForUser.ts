import { NotificationRepository } from '../domain/NotificationRepository';

interface deleteNotificationsForUserProps {
  userId: string;
  notificationRepository: NotificationRepository;
}

export async function deleteNotificationsForUser({
  userId,
  notificationRepository,
}: deleteNotificationsForUserProps): Promise<void> {
  await notificationRepository.deleteForUser(userId);
}
