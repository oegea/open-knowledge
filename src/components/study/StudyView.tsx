'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CoursePrimitive } from '@/modules/course/domain/Course';
import { MaterialPrimitive } from '@/modules/course/domain/Material';
import { CourseProgress } from '@/modules/study/domain/CourseProgress';
import { getCourseProgress } from '@/modules/study/application/getCourseProgress';
import { markMaterialCompleted } from '@/modules/study/application/markMaterialCompleted';
import { trackMaterialVisit } from '@/modules/study/application/trackMaterialVisit';
import { LocalStorageProgressRepository } from '@/modules/study/infrastructure/LocalStorageProgressRepository';
import { useI18n } from '@/i18n/I18nProvider';
import { MaterialRenderer } from './MaterialRenderer';
import styles from './StudyView.module.css';

interface StudyViewProps {
  course: CoursePrimitive;
  currentMaterialId: string;
}

interface FlatMaterial {
  material: MaterialPrimitive;
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
}

export function StudyView({ course, currentMaterialId }: StudyViewProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [contentsOpen, setContentsOpen] = useState(false);
  const progressRepository = useMemo(() => new LocalStorageProgressRepository(), []);

  const flatMaterials: FlatMaterial[] = useMemo(
    () =>
      course.sections.flatMap((section, sectionIndex) =>
        section.materials.map((material) => ({
          material,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionIndex,
        }))
      ),
    [course.sections]
  );

  const orderedMaterialIds = useMemo(
    () => flatMaterials.map((entry) => entry.material.id),
    [flatMaterials]
  );

  const currentIndex = orderedMaterialIds.indexOf(currentMaterialId);
  const current = flatMaterials[currentIndex];
  const previous = currentIndex > 0 ? flatMaterials[currentIndex - 1] : null;
  const next = currentIndex < flatMaterials.length - 1 ? flatMaterials[currentIndex + 1] : null;

  useEffect(() => {
    (async () => {
      const updated = await trackMaterialVisit({
        courseId: course.id!,
        materialId: currentMaterialId,
        progressRepository,
      });
      setProgress(updated);
    })();
  }, [course.id, currentMaterialId, progressRepository]);

  const handleComplete = useCallback(async () => {
    const updated = await markMaterialCompleted({
      courseId: course.id!,
      materialId: currentMaterialId,
      progressRepository,
    });
    setProgress(updated);
    if (next) {
      router.push(`/courses/${course.id}/study/${next.material.id}`);
    }
  }, [course.id, currentMaterialId, next, progressRepository, router]);

  const refreshProgress = useCallback(async () => {
    setProgress(
      await getCourseProgress({ courseId: course.id!, progressRepository })
    );
  }, [course.id, progressRepository]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  if (!current) return null;

  const ratio = progress ? progress.completionRatio(orderedMaterialIds) : 0;
  const isCompleted = progress?.isMaterialCompleted(currentMaterialId) ?? false;

  return (
    <div className={styles.study}>
      <header className={`ok-glass-strong ${styles.header}`}>
        <Link
          href={`/courses/${course.id}`}
          className={styles.backButton}
          aria-label={t('common.back')}
        >
          ←
        </Link>
        <div className={styles.headerInfo}>
          <span className={styles.courseTitle}>{course.title}</span>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={Math.round(ratio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('study.progress')}
          >
            <span className={styles.progressFill} style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>
        <button
          className={styles.contentsButton}
          aria-expanded={contentsOpen}
          aria-label={t('course.contents')}
          onClick={() => setContentsOpen(!contentsOpen)}
        >
          ☰
        </button>
      </header>

      <div className={styles.body}>
        <aside
          className={`${styles.contents} ${contentsOpen ? styles.contentsOpen : ''}`}
          aria-label={t('course.contents')}
        >
          <nav className={`ok-glass-strong ${styles.contentsPanel}`}>
            {course.sections.map((section) => {
              const sectionCompleted = section.materials.every(
                (material) => progress?.isMaterialCompleted(material.id) ?? false
              );
              return (
                <details
                  key={section.id}
                  className={styles.contentsSection}
                  open={section.id === current.sectionId || !sectionCompleted}
                >
                  <summary className={styles.contentsSectionTitle}>
                    {sectionCompleted ? (
                      <span className={styles.sectionCheck} aria-label={t('study.completed')}>
                        ✓
                      </span>
                    ) : null}
                    {section.title}
                  </summary>
                  <ul className={styles.contentsMaterials}>
                    {section.materials.map((material) => {
                      const completed = progress?.isMaterialCompleted(material.id) ?? false;
                      const isCurrent = material.id === currentMaterialId;
                      return (
                        <li key={material.id}>
                          <Link
                            href={`/courses/${course.id}/study/${material.id}`}
                            className={styles.contentsMaterial}
                            aria-current={isCurrent ? 'page' : undefined}
                            onClick={() => setContentsOpen(false)}
                          >
                            <span
                              className={
                                completed ? styles.materialCheckDone : styles.materialCheck
                              }
                              aria-hidden="true"
                            >
                              {completed ? '✓' : ''}
                            </span>
                            <span className={styles.contentsMaterialTitle}>{material.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
          </nav>
        </aside>

        <main className={styles.content}>
          <p className={styles.breadcrumb}>
            {current.sectionIndex + 1} · {current.sectionTitle}
          </p>
          <h1 className={styles.materialTitle}>{current.material.title}</h1>

          <MaterialRenderer
            material={current.material}
            onExamPassed={handleComplete}
            onExamRetry={refreshProgress}
          />

          {current.material.sources.length > 0 ? (
            <p className={styles.materialSources}>
              <strong>{t('admin.sources')}:</strong> {current.material.sources.join(' · ')}
            </p>
          ) : null}
        </main>
      </div>

      <footer className={`ok-glass-strong ${styles.footer}`}>
        {previous ? (
          <Link
            href={`/courses/${course.id}/study/${previous.material.id}`}
            className={styles.navButton}
          >
            ← <span className={styles.navLabel}>{t('study.previous')}</span>
          </Link>
        ) : (
          <span />
        )}

        {current.material.type !== 'exam' ? (
          isCompleted ? (
            <span className={styles.completedBadge}>✓ {t('study.completed')}</span>
          ) : (
            <button className={styles.completeButton} onClick={handleComplete}>
              ✓ <span>{t('study.markComplete')}</span>
            </button>
          )
        ) : null}

        {next ? (
          <Link
            href={`/courses/${course.id}/study/${next.material.id}`}
            className={styles.navButton}
          >
            <span className={styles.navLabel}>{t('study.next')}</span> →
          </Link>
        ) : (
          <span />
        )}
      </footer>
    </div>
  );
}
