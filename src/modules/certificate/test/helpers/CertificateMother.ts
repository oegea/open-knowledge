import { Certificate, CertificatePrimitive } from '../../domain/Certificate';

export function create(overrides: Partial<CertificatePrimitive> = {}): Certificate {
  return Certificate.fromPrimitive({
    id: 'cert-1',
    userId: 'user-1',
    courseId: 'course-1',
    courseTitle: 'Introduction to Astronomy',
    identifier: 'Erudito#4821',
    displayName: '',
    issuedAt: '2026-08-08T10:00:00.000Z',
    ...overrides,
  });
}
