export interface SessionPrimitive {
  tokenHash: string;
  userId: string;
  expiresAt: string;
}

export class Session {
  private constructor(
    private readonly tokenHash: string,
    private readonly userId: string,
    private readonly expiresAt: Date
  ) {}

  static create(tokenHash: string, userId: string, expiresAt: Date): Session {
    Session.ensureSessionIsValid(tokenHash, userId, expiresAt);
    return new Session(tokenHash, userId, expiresAt);
  }

  static fromPrimitive(data: SessionPrimitive): Session {
    if (!data) throw new Error('[Session] data must be provided');
    return Session.create(data.tokenHash, data.userId, new Date(data.expiresAt));
  }

  static ensureSessionIsValid(tokenHash: string, userId: string, expiresAt: Date): void {
    if (!tokenHash || typeof tokenHash !== 'string') {
      throw new Error('[Session] tokenHash must be a non-empty string');
    }
    if (!userId || typeof userId !== 'string') {
      throw new Error('[Session] userId must be a non-empty string');
    }
    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
      throw new Error('[Session] expiresAt must be a valid date');
    }
  }

  getTokenHash(): string {
    return this.tokenHash;
  }

  getUserId(): string {
    return this.userId;
  }

  getExpiresAt(): Date {
    return new Date(this.expiresAt);
  }

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  equals(other: Session): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): SessionPrimitive {
    return {
      tokenHash: this.tokenHash,
      userId: this.userId,
      expiresAt: this.expiresAt.toISOString(),
    };
  }
}
