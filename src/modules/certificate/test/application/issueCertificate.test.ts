import { issueCertificate } from '../../application/issueCertificate';
import { CourseProgress } from '../../../study/domain/CourseProgress';
import * as CourseMother from '../../../course/test/helpers/CourseMother';
import * as SectionMother from '../../../course/test/helpers/SectionMother';
import * as MaterialMother from '../../../course/test/helpers/MaterialMother';
import * as ExamMother from '../../../course/test/helpers/ExamMother';
import * as CourseRepositoryMother from '../../../course/test/helpers/CourseRepositoryMother';
import * as ProgressRepositoryMother from '../../../study/test/helpers/ProgressRepositoryMother';
import * as ExamResultRepositoryMother from '../../../assessment/test/helpers/ExamResultRepositoryMother';
import * as CertificateMother from '../helpers/CertificateMother';
import * as CertificateRepositoryMother from '../helpers/CertificateRepositoryMother';

function publishedCourseWithExam() {
  return CourseMother.create({
    published: true,
    sections: [
      SectionMother.createPrimitive({
        materials: [
          MaterialMother.createPrimitive({ id: 'm1', required: true }),
          MaterialMother.createPrimitive({ id: 'm2', required: false }),
          MaterialMother.createPrimitive({
            id: 'exam-1',
            type: 'exam',
            markdown: '',
            required: true,
            exam: ExamMother.createPrimitive(),
          }),
        ],
      }),
    ],
  });
}

function fullProgress() {
  return CourseProgress.fromPrimitive({
    courseId: 'course-1',
    completedMaterialIds: ['m1', 'exam-1'],
    lastMaterialId: 'exam-1',
  });
}

describe('issueCertificate (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('issues the certificate when requirements are verified server-side', async () => {
      const certificateRepository = CertificateRepositoryMother.create();

      const certificate = await issueCertificate({
        userId: 'user-1',
        identifier: 'Erudito#4821',
        courseId: 'course-1',
        courseRepository: CourseRepositoryMother.create({
          findById: jest.fn().mockResolvedValue(publishedCourseWithExam()),
        }),
        progressRepository: ProgressRepositoryMother.create({
          getProgress: jest.fn().mockResolvedValue(fullProgress()),
        }),
        examResultRepository: ExamResultRepositoryMother.create({
          hasPassed: jest.fn().mockResolvedValue(true),
        }),
        certificateRepository,
      });

      expect(certificate.getCourseTitle()).toBe('Introduction to Astronomy');
      expect(certificate.getIdentifier()).toBe('Erudito#4821');
      expect(certificateRepository.save).toHaveBeenCalledWith(certificate);
    });

    it('returns the existing certificate instead of duplicating it', async () => {
      const existing = CertificateMother.create();
      const certificateRepository = CertificateRepositoryMother.create({
        findByUserAndCourse: jest.fn().mockResolvedValue(existing),
      });

      const certificate = await issueCertificate({
        userId: 'user-1',
        identifier: 'Erudito#4821',
        courseId: 'course-1',
        courseRepository: CourseRepositoryMother.create(),
        progressRepository: ProgressRepositoryMother.create(),
        examResultRepository: ExamResultRepositoryMother.create(),
        certificateRepository,
      });

      expect(certificate).toBe(existing);
      expect(certificateRepository.save).not.toHaveBeenCalled();
    });

    it('ignores optional materials when checking completion', async () => {
      const certificate = await issueCertificate({
        userId: 'user-1',
        identifier: 'Erudito#4821',
        courseId: 'course-1',
        courseRepository: CourseRepositoryMother.create({
          findById: jest.fn().mockResolvedValue(publishedCourseWithExam()),
        }),
        // m2 (optional) is NOT completed
        progressRepository: ProgressRepositoryMother.create({
          getProgress: jest.fn().mockResolvedValue(fullProgress()),
        }),
        examResultRepository: ExamResultRepositoryMother.create({
          hasPassed: jest.fn().mockResolvedValue(true),
        }),
        certificateRepository: CertificateRepositoryMother.create(),
      });

      expect(certificate.getId()).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('refuses when a required material is not completed', async () => {
      await expect(
        issueCertificate({
          userId: 'user-1',
          identifier: 'Erudito#4821',
          courseId: 'course-1',
          courseRepository: CourseRepositoryMother.create({
            findById: jest.fn().mockResolvedValue(publishedCourseWithExam()),
          }),
          progressRepository: ProgressRepositoryMother.create(),
          examResultRepository: ExamResultRepositoryMother.create({
            hasPassed: jest.fn().mockResolvedValue(true),
          }),
          certificateRepository: CertificateRepositoryMother.create(),
        })
      ).rejects.toThrow('[issueCertificate] Course requirements are not fulfilled yet');
    });

    it('refuses when the required exam has no passing result on record', async () => {
      await expect(
        issueCertificate({
          userId: 'user-1',
          identifier: 'Erudito#4821',
          courseId: 'course-1',
          courseRepository: CourseRepositoryMother.create({
            findById: jest.fn().mockResolvedValue(publishedCourseWithExam()),
          }),
          progressRepository: ProgressRepositoryMother.create({
            getProgress: jest.fn().mockResolvedValue(fullProgress()),
          }),
          examResultRepository: ExamResultRepositoryMother.create({
            hasPassed: jest.fn().mockResolvedValue(false),
          }),
          certificateRepository: CertificateRepositoryMother.create(),
        })
      ).rejects.toThrow('[issueCertificate] Course requirements are not fulfilled yet');
    });

    it('refuses unpublished courses', async () => {
      await expect(
        issueCertificate({
          userId: 'user-1',
          identifier: 'Erudito#4821',
          courseId: 'course-1',
          courseRepository: CourseRepositoryMother.create({
            findById: jest.fn().mockResolvedValue(CourseMother.create({ published: false })),
          }),
          progressRepository: ProgressRepositoryMother.create(),
          examResultRepository: ExamResultRepositoryMother.create(),
          certificateRepository: CertificateRepositoryMother.create(),
        })
      ).rejects.toThrow('[issueCertificate] Course with id course-1 not found');
    });
  });
});
