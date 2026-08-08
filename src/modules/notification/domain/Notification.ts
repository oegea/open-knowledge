export const NOTIFICATION_TYPES = [
  'course_published',
  'course_updated',
  'news_published',
  'certificate_issued',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationPrimitive {
  id: string | null;
  /** Null for broadcast notifications addressed to every registered user. */
  userId: string | null;
  type: NotificationType;
  title: string;
  refId: string | null;
  createdAt: string;
}

export class Notification {
  private constructor(
    private readonly id: string | null,
    private readonly userId: string | null,
    private readonly type: NotificationType,
    private readonly title: string,
    private readonly refId: string | null,
    private readonly createdAt: Date
  ) {}

  static create(
    id: string | null,
    userId: string | null,
    type: NotificationType,
    title: string,
    refId: string | null,
    createdAt?: Date
  ): Notification {
    Notification.ensureNotificationIsValid(type, title);
    return new Notification(id, userId, type, title.trim(), refId, createdAt ?? new Date());
  }

  static fromPrimitive(data: NotificationPrimitive): Notification {
    if (!data) throw new Error('[Notification] data must be provided');
    return Notification.create(
      data.id,
      data.userId,
      data.type,
      data.title,
      data.refId,
      data.createdAt ? new Date(data.createdAt) : undefined
    );
  }

  static ensureNotificationIsValid(type: NotificationType, title: string): void {
    if (!NOTIFICATION_TYPES.includes(type)) {
      throw new Error(`[Notification] "${type}" is not a valid notification type`);
    }
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('[Notification] title cannot be empty');
    }
  }

  getId(): string | null {
    return this.id;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getType(): NotificationType {
    return this.type;
  }

  getTitle(): string {
    return this.title;
  }

  getRefId(): string | null {
    return this.refId;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  isBroadcast(): boolean {
    return this.userId === null;
  }

  equals(other: Notification): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): NotificationPrimitive {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      refId: this.refId,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
