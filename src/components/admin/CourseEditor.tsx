'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Course, CoursePrimitive, CourseDetailsInput } from '@/modules/course/domain/Course';
import { HttpCourseAdminRepository } from '@/modules/course/infrastructure/HttpCourseAdminRepository';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { CourseDetailsForm } from './CourseDetailsForm';
import { StructureEditor } from './StructureEditor';
import styles from './CourseEditor.module.css';

interface CourseEditorProps {
  initialCourse: CoursePrimitive;
}

export function CourseEditor({ initialCourse }: CourseEditorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [course, setCourse] = useState<CoursePrimitive>(initialCourse);
  const [tab, setTab] = useState<'details' | 'structure'>('structure');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const repository = new HttpCourseAdminRepository();

  const applyUpdate = (updated: Course) => {
    setCourse(updated.toPrimitive());
    setErrorMessage(null);
  };

  const handleAction = async (action: () => Promise<Course>) => {
    try {
      applyUpdate(await action());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleDetailsSubmit = async (details: CourseDetailsInput) => {
    applyUpdate(await repository.updateCourseDetails(course.id!, details));
  };

  const handleDelete = async () => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await repository.deleteCourse(course.id!);
      router.push('/admin');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    }
  };

  return (
    <div className={styles.editor}>
      <header className={`ok-glass ${styles.header}`}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{course.title}</h1>
          <span className={course.published ? styles.badgePublished : styles.badgeDraft}>
            {t(course.published ? 'admin.published' : 'admin.draft')}
          </span>
        </div>
        <div className={styles.headerActions}>
          {course.published ? (
            <Button
              variant="soft"
              size="sm"
              onClick={() => handleAction(() => repository.unpublishCourse(course.id!))}
            >
              {t('admin.unpublish')}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleAction(() => repository.publishCourse(course.id!))}
            >
              {t('admin.publish')}
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </header>

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}

      <div role="tablist" className={styles.tabs}>
        <button
          role="tab"
          aria-selected={tab === 'structure'}
          className={styles.tab}
          onClick={() => setTab('structure')}
        >
          {t('admin.structure')}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'details'}
          className={styles.tab}
          onClick={() => setTab('details')}
        >
          {t('admin.details')}
        </button>
      </div>

      {tab === 'details' ? (
        <section className={`ok-glass ${styles.panel}`}>
          <CourseDetailsForm
            initial={{
              title: course.title,
              description: course.description,
              language: course.language,
              category: course.category,
              coverImage: course.coverImage,
              authors: course.authors,
              sources: course.sources,
              aiAssisted: course.aiAssisted,
            }}
            submitLabel={t('common.save')}
            onSubmit={handleDetailsSubmit}
          />
        </section>
      ) : (
        <StructureEditor course={course} onCourseChange={setCourse} onError={setErrorMessage} />
      )}
    </div>
  );
}
