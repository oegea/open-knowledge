export interface CertificatePrimitive {
  id: string | null;
  userId: string;
  courseId: string;
  courseTitle: string;
  identifier: string;
  issuedAt: string;
}

export class Certificate {
  private constructor(
    private readonly id: string | null,
    private readonly userId: string,
    private readonly courseId: string,
    private readonly courseTitle: string,
    private readonly identifier: string,
    private readonly issuedAt: Date
  ) {}

  static create(
    id: string | null,
    userId: string,
    courseId: string,
    courseTitle: string,
    identifier: string,
    issuedAt?: Date
  ): Certificate {
    Certificate.ensureCertificateIsValid(userId, courseId, courseTitle, identifier);
    return new Certificate(id, userId, courseId, courseTitle, identifier, issuedAt ?? new Date());
  }

  static fromPrimitive(data: CertificatePrimitive): Certificate {
    if (!data) throw new Error('[Certificate] data must be provided');
    return Certificate.create(
      data.id,
      data.userId,
      data.courseId,
      data.courseTitle,
      data.identifier,
      data.issuedAt ? new Date(data.issuedAt) : undefined
    );
  }

  static ensureCertificateIsValid(
    userId: string,
    courseId: string,
    courseTitle: string,
    identifier: string
  ): void {
    if (!userId) throw new Error('[Certificate] userId must be provided');
    if (!courseId) throw new Error('[Certificate] courseId must be provided');
    if (!courseTitle || courseTitle.trim() === '') {
      throw new Error('[Certificate] courseTitle cannot be empty');
    }
    if (!identifier) throw new Error('[Certificate] identifier must be provided');
  }

  getId(): string | null {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getCourseId(): string {
    return this.courseId;
  }

  getCourseTitle(): string {
    return this.courseTitle;
  }

  getIdentifier(): string {
    return this.identifier;
  }

  getIssuedAt(): Date {
    return new Date(this.issuedAt);
  }

  equals(other: Certificate): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): CertificatePrimitive {
    return {
      id: this.id,
      userId: this.userId,
      courseId: this.courseId,
      courseTitle: this.courseTitle,
      identifier: this.identifier,
      issuedAt: this.issuedAt.toISOString(),
    };
  }
}
