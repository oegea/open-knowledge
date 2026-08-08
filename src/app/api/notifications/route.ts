import notificationFactory from '@/modules/notification/application/factory';
import { getCurrentUser } from '@/app/serverAuth';

export async function GET() {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  const feed = await notificationFactory.listNotifications(user.getId()!);
  return Response.json({
    notifications: feed.notifications.map((notification) => notification.toPrimitive()),
    unreadCount: feed.unreadCount,
  });
}

export async function POST() {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  await notificationFactory.markNotificationsSeen(user.getId()!);
  return Response.json({ seen: true });
}
