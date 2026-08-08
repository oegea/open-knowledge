import { publishNotification } from '../../application/publishNotification';
import { listNotifications } from '../../application/listNotifications';
import { markNotificationsSeen } from '../../application/markNotificationsSeen';
import { Notification } from '../../domain/Notification';
import * as NotificationRepositoryMother from '../helpers/NotificationRepositoryMother';

describe('notification use cases (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publishNotification', () => {
    it('publishes a broadcast notification by default', async () => {
      const notificationRepository = NotificationRepositoryMother.create();

      const notification = await publishNotification({
        type: 'course_published',
        title: 'Astronomy 101',
        refId: 'course-1',
        notificationRepository,
      });

      expect(notification.isBroadcast()).toBe(true);
      expect(notification.getType()).toBe('course_published');
      expect(notificationRepository.save).toHaveBeenCalledWith(notification);
    });

    it('publishes a personal notification when a user is given', async () => {
      const notification = await publishNotification({
        userId: 'user-1',
        type: 'certificate_issued',
        title: 'Astronomy 101',
        refId: 'cert-1',
        notificationRepository: NotificationRepositoryMother.create(),
      });

      expect(notification.isBroadcast()).toBe(false);
      expect(notification.getUserId()).toBe('user-1');
    });

    it('rejects unknown types', async () => {
      await expect(
        publishNotification({
          type: 'spam' as never,
          title: 'x',
          notificationRepository: NotificationRepositoryMother.create(),
        })
      ).rejects.toThrow('[Notification] "spam" is not a valid notification type');
    });
  });

  describe('listNotifications', () => {
    it('counts everything as unread when the user never opened the panel', async () => {
      const notifications = [
        Notification.create('n1', null, 'course_published', 'A', 'c1', new Date('2026-08-01')),
        Notification.create('n2', null, 'news_published', 'B', 'p1', new Date('2026-08-05')),
      ];
      const notificationRepository = NotificationRepositoryMother.create({
        findForUser: jest.fn().mockResolvedValue(notifications),
      });

      const feed = await listNotifications({ userId: 'user-1', notificationRepository });

      expect(feed.unreadCount).toBe(2);
    });

    it('counts only notifications newer than seenAt as unread', async () => {
      const notifications = [
        Notification.create('n1', null, 'course_published', 'A', 'c1', new Date('2026-08-01')),
        Notification.create('n2', null, 'news_published', 'B', 'p1', new Date('2026-08-05')),
      ];
      const notificationRepository = NotificationRepositoryMother.create({
        findForUser: jest.fn().mockResolvedValue(notifications),
        getSeenAt: jest.fn().mockResolvedValue(new Date('2026-08-03')),
      });

      const feed = await listNotifications({ userId: 'user-1', notificationRepository });

      expect(feed.unreadCount).toBe(1);
    });
  });

  describe('markNotificationsSeen', () => {
    it('stores the seen timestamp for the user', async () => {
      const notificationRepository = NotificationRepositoryMother.create();

      await markNotificationsSeen({ userId: 'user-1', notificationRepository });

      expect(notificationRepository.markSeen).toHaveBeenCalledWith('user-1', expect.any(Date));
    });
  });
});
