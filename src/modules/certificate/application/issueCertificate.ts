import { randomUUID } from 'crypto';
import { Certificate } from '../domain/Certificate';
import { CertificateRepository } from '../domain/CertificateRepository';
import { CourseRepository } from '../../course/domain/CourseRepository';
import { ProgressRepository } from '../../study/domain/ProgressRepository';
import { ExamResultRepository } from '../../assessment/domain/ExamResultRepository';

interface issueCertificateProps {
  userId: string;
  identifier: string;
  courseId: string;
  courseRepository: CourseRepository;
  progressRepository: ProgressRepository;
  examResultRepository: ExamResultRepository;
  certificateRepository: CertificateRepository;
  /** Port: personal notification when a certificate is newly issued. */
  onCertificateIssued?: (certificate: Certificate) => Promise<void>;
}

/**
 * Issues a completion certificate after verifying, server-side, that the
 * identity really completed the course: every required material is marked
 * completed and every required exam has a passing result on record.
 */
export async function issueCertificate({
  userId,
  identifier,
  courseId,
  courseRepository,
  progressRepository,
  examResultRepository,
  certificateRepository,
  onCertificateIssued,
}: issueCertificateProps): Promise<Certificate> {
  if (!userId) {
    throw new Error('[issueCertificate] User id must be provided');
  }

  const existing = await certificateRepository.findByUserAndCourse(userId, courseId);
  if (existing !== null) return existing;

  const course = await courseRepository.findById(courseId);
  if (course === null || !course.isPublished()) {
    throw new Error(`[issueCertificate] Course with id ${courseId} not found`);
  }

  const progress = await progressRepository.getProgress(courseId);
  const requiredMaterials = course
    .getSections()
    .getSections()
    .flatMap((section) => section.getMaterials().getMaterials())
    .filter((material) => material.isRequired());

  for (const material of requiredMaterials) {
    if (material.isExam()) {
      if (!(await examResultRepository.hasPassed(userId, courseId, material.getId()))) {
        throw new Error('[issueCertificate] Course requirements are not fulfilled yet');
      }
    } else if (!progress.isMaterialCompleted(material.getId())) {
      throw new Error('[issueCertificate] Course requirements are not fulfilled yet');
    }
  }

  const certificate = Certificate.create(
    randomUUID(),
    userId,
    courseId,
    course.getTitle(),
    identifier
  );

  const saved = await certificateRepository.save(certificate);
  if (onCertificateIssued) {
    await onCertificateIssued(saved);
  }
  return saved;
}
