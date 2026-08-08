'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NotificationPrimitive } from '@/modules/notification/domain/Notification';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './NotificationsBell.module.css';

const TYPE_KEYS: Record<NotificationPrimitive['type'], string> = {
  course_published: 'notifications.coursePublished',
  course_updated: 'notifications.courseUpdated',
  news_published: 'notifications.newsPublished',
  certificate_issued: 'notifications.certificateIssued',
};

function notificationHref(notification: NotificationPrimitive): string {
  switch (notification.type) {
    case 'course_published':
    case 'course_updated':
      return `/courses/${notification.refId}`;
    case 'news_published':
      return `/news/${notification.refId}`;
    case 'certificate_issued':
      return `/certificates/${notification.refId}`;
  }
}

export function NotificationsBell() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPrimitive[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) return;
      const body = await response.json();
      setNotifications(body.notifications);
      setUnreadCount(body.unreadCount);
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setUnreadCount(0);
      await fetch('/api/notifications', { method: 'POST' });
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.bell}
        aria-label={t('notifications.title')}
        aria-expanded={open}
        onClick={handleToggle}
      >
        ◔
        {unreadCount > 0 ? (
          <span className={styles.badge} aria-label={String(unreadCount)}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className={`ok-glass-strong ${styles.panel}`} role="region" aria-label={t('notifications.title')}>
          <p className={styles.panelTitle}>{t('notifications.title')}</p>
          {notifications.length === 0 ? (
            <p className={styles.empty}>{t('notifications.empty')}</p>
          ) : (
            <ul className={styles.list}>
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notificationHref(notification)}
                    className={styles.item}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.itemText}>
                      {t(TYPE_KEYS[notification.type], { title: notification.title })}
                    </span>
                    <time className={styles.itemDate}>
                      {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                        new Date(notification.createdAt)
                      )}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
