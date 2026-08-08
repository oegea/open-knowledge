import { UserIdentifier } from './UserIdentifier';

export interface UserPrimitive {
  id: string | null;
  identifier: string;
  totpSecret: string;
  recoveryCodeHash: string;
  isAdmin: boolean;
  createdAt: string;
}

export class User {
  private constructor(
    private readonly id: string | null,
    private readonly identifier: UserIdentifier,
    private readonly totpSecret: string,
    private readonly recoveryCodeHash: string,
    private readonly isAdminFlag: boolean,
    private readonly createdAt: Date
  ) {}

  static create(
    id: string | null,
    identifier: string,
    totpSecret: string,
    recoveryCodeHash: string,
    isAdmin: boolean,
    createdAt?: Date
  ): User {
    User.ensureUserIsValid(totpSecret, recoveryCodeHash);
    return new User(
      id,
      UserIdentifier.create(identifier),
      totpSecret,
      recoveryCodeHash,
      isAdmin,
      createdAt ?? new Date()
    );
  }

  static fromPrimitive(data: UserPrimitive): User {
    if (!data) throw new Error('[User] data must be provided');
    return User.create(
      data.id,
      data.identifier,
      data.totpSecret,
      data.recoveryCodeHash,
      Boolean(data.isAdmin),
      data.createdAt ? new Date(data.createdAt) : undefined
    );
  }

  static ensureUserIsValid(totpSecret: string, recoveryCodeHash: string): void {
    if (!totpSecret || typeof totpSecret !== 'string') {
      throw new Error('[User] totpSecret must be a non-empty string');
    }
    if (!recoveryCodeHash || typeof recoveryCodeHash !== 'string') {
      throw new Error('[User] recoveryCodeHash must be a non-empty string');
    }
  }

  getId(): string | null {
    return this.id;
  }

  getIdentifier(): string {
    return this.identifier.toPrimitive();
  }

  getTotpSecret(): string {
    return this.totpSecret;
  }

  getRecoveryCodeHash(): string {
    return this.recoveryCodeHash;
  }

  isAdmin(): boolean {
    return this.isAdminFlag;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  setId(id: string): User {
    return User.create(
      id,
      this.identifier.toPrimitive(),
      this.totpSecret,
      this.recoveryCodeHash,
      this.isAdminFlag,
      this.createdAt
    );
  }

  /** Used by account recovery: bind a new TOTP secret and recovery code. */
  rebindCredentials(totpSecret: string, recoveryCodeHash: string): User {
    return User.create(
      this.id,
      this.identifier.toPrimitive(),
      totpSecret,
      recoveryCodeHash,
      this.isAdminFlag,
      this.createdAt
    );
  }

  equals(other: User): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): UserPrimitive {
    return {
      id: this.id,
      identifier: this.identifier.toPrimitive(),
      totpSecret: this.totpSecret,
      recoveryCodeHash: this.recoveryCodeHash,
      isAdmin: this.isAdminFlag,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
