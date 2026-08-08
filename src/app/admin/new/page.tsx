'use client';

import { useRouter } from 'next/navigation';
import { CourseDetailsInput } from '@/modules/course/domain/Course';
import { HttpCourseAdminRepository } from '@/modules/course/infrastructure/HttpCourseAdminRepository';
import { useI18n } from '@/i18n/I18nProvider';
import { CourseDetailsForm } from '@/components/admin/CourseDetailsForm';
import styles from './page.module.css';

export default function NewCoursePage() {
  const router = useRouter();
  const { t } = useI18n();

  const handleCreate = async (details: CourseDetailsInput) => {
    const repository = new HttpCourseAdminRepository();
    const course = await repository.createCourse(details);
    router.push(`/admin/courses/${course.getId()}`);
  };

  return (
    <div className={`ok-glass ${styles.panel}`}>
      <h1 className={styles.title}>{t('admin.newCourse')}</h1>
      <CourseDetailsForm submitLabel={t('common.save')} onSubmit={handleCreate} />
    </div>
  );
}
