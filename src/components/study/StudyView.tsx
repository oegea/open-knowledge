'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CoursePrimitive } from '@/modules/course/domain/Course';
import { MaterialPrimitive } from '@/modules/course/domain/Material';
import { CourseProgress } from '@/modules/study/domain/CourseProgress';
import { getCourseProgress } from '@/modules/study/application/getCourseProgress';
import { markMaterialCompleted } from '@/modules/study/application/markMaterialCompleted';
import { unmarkMaterialCompleted } from '@/modules/study/application/unmarkMaterialCompleted';
import { trackMaterialVisit } from '@/modules/study/application/trackMaterialVisit';
import { mergeProgress } from '@/modules/study/application/mergeProgress';
import { LocalStorageProgressRepository } from '@/modules/study/infrastructure/LocalStorageProgressRepository';
import { HttpProgressRepository } from '@/modules/study/infrastructure/HttpProgressRepository';
import { useI18n } from '@/i18n/I18nProvider';
import { MaterialRenderer } from './MaterialRenderer';
import { ReadingProgress } from './ReadingProgress';
import styles from './StudyView.module.css';

interface StudyViewProps {
  course: CoursePrimitive;
  currentMaterialId: string;
  authenticated: boolean;
}

interface FlatMaterial {
  material: MaterialPrimitive;
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
}

export function StudyView({ course, currentMaterialId, authenticated }: StudyViewProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const progressRepository = useMemo(
    () => (authenticated ? new HttpProgressRepository() : new LocalStorageProgressRepository()),
    [authenticated]
  );

  // Signing in adopts the progress made anonymously on this device.
  useEffect(() => {
    if (!authenticated) return;
    (async () => {
      const localRepository = new LocalStorageProgressRepository();
      const merged = await mergeProgress({
        courseId: course.id!,
        sourceRepository: localRepository,
        targetRepository: new HttpProgressRepository(),
      });
      localRepository.clear(course.id!);
      setProgress(merged);
    })();
  }, [authenticated, course.id]);

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

      // Reaching the last material completes it on entry, like closing a
      // book — except exams, which complete only when passed.
      const isLast = orderedMaterialIds[orderedMaterialIds.length - 1] === currentMaterialId;
      const material = flatMaterials.find((entry) => entry.material.id === currentMaterialId);
      if (
        isLast &&
        material &&
        material.material.type !== 'exam' &&
        !updated.isMaterialCompleted(currentMaterialId)
      ) {
        setProgress(
          await markMaterialCompleted({
            courseId: course.id!,
            materialId: currentMaterialId,
            progressRepository,
          })
        );
        return;
      }

      setProgress(updated);
    })();
  }, [course.id, currentMaterialId, flatMaterials, orderedMaterialIds, progressRepository]);

  const handleComplete = useCallback(async () => {
    const updated = await markMaterialCompleted({
      courseId: course.id!,
      materialId: currentMaterialId,
      progressRepository,
    });
    setProgress(updated);
  }, [course.id, currentMaterialId, progressRepository]);

  const handleUnmark = useCallback(async () => {
    const updated = await unmarkMaterialCompleted({
      courseId: course.id!,
      materialId: currentMaterialId,
      progressRepository,
    });
    setProgress(updated);
  }, [course.id, currentMaterialId, progressRepository]);

  // Book-like navigation: moving forward marks the current reading as done.
  const handleNext = useCallback(async () => {
    if (!next) return;
    const currentEntry = flatMaterials[currentIndex];
    if (
      currentEntry &&
      currentEntry.material.type !== 'exam' &&
      !(progress?.isMaterialCompleted(currentMaterialId) ?? false)
    ) {
      const updated = await markMaterialCompleted({
        courseId: course.id!,
        materialId: currentMaterialId,
        progressRepository,
      });
      setProgress(updated);
    }
    router.push(`/courses/${course.id}/study/${next.material.id}`);
  }, [
    course.id,
    currentIndex,
    currentMaterialId,
    flatMaterials,
    next,
    progress,
    progressRepository,
    router,
  ]);

  const refreshProgress = useCallback(async () => {
    setProgress(
      await getCourseProgress({ courseId: course.id!, progressRepository })
    );
  }, [course.id, progressRepository]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  // Registered users get their attempt graded and recorded server-side.
  const handleExamFinished = useCallback(
    async (answers: Record<string, string>) => {
      if (!authenticated) return;
      await fetch('/api/exam-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, materialId: currentMaterialId, answers }),
      });
    },
    [authenticated, course.id, currentMaterialId]
  );

  const handleGetCertificate = useCallback(async () => {
    const response = await fetch('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course.id }),
    });
    const body = await response.json();
    if (response.ok) {
      setCertificateId(body.certificate.id);
      router.push(`/certificates/${body.certificate.id}`);
    }
  }, [course.id, router]);

  if (!current) return null;

  // Editorial touch: estimated reading time for text materials (~200 wpm).
  const readingMinutes =
    current.material.type === 'markdown'
      ? Math.max(1, Math.round(current.material.markdown.split(/\s+/).length / 200))
      : null;

  const ratio = progress ? progress.completionRatio(orderedMaterialIds) : 0;
  const isCompleted = progress?.isMaterialCompleted(currentMaterialId) ?? false;
  const requiredMaterialIds = flatMaterials
    .filter((entry) => entry.material.required)
    .map((entry) => entry.material.id);
  const courseCompleted =
    progress !== null &&
    requiredMaterialIds.length > 0 &&
    requiredMaterialIds.every((id) => progress.isMaterialCompleted(id));

  return (
    <div className={styles.study}>
      <ReadingProgress key={currentMaterialId} />
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
          {courseCompleted ? (
            <aside className={`ok-glass ${styles.completedBanner}`} role="status">
              <p className={styles.completedTitle}>🎉 {t('study.courseCompleted')}</p>
              {authenticated ? (
                <button
                  className={styles.certificateButton}
                  onClick={handleGetCertificate}
                  disabled={certificateId !== null}
                >
                  {t('certificate.get')}
                </button>
              ) : (
                <p className={styles.completedHint}>
                  {t('study.registerToKeep')}{' '}
                  <Link href="/register" className={styles.completedLink}>
                    {t('auth.register')}
                  </Link>
                </p>
              )}
            </aside>
          ) : null}

          <p className={styles.breadcrumb}>
            {current.sectionIndex + 1} · {current.sectionTitle}
            {readingMinutes !== null ? (
              <span className={styles.readingTime}>
                {t('study.readingTime', { min: readingMinutes })}
              </span>
            ) : null}
          </p>
          <h1 className={styles.materialTitle}>{current.material.title}</h1>

          <MaterialRenderer
            material={current.material}
            coverImage={course.coverImage}
            onExamPassed={handleComplete}
            onExamFinished={handleExamFinished}
          />

          {current.material.sources.length > 0 ? (
            <div className={styles.materialSources}>
              <strong>{t('course.bibliography')}</strong>
              <ul className={styles.sourceList}>
                {current.material.sources.map((source, index) => (
                  <li key={index}>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.sourceLink}
                      >
                        {source.title} ↗
                      </a>
                    ) : (
                      source.title
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </main>
      </div>

      <footer className={`ok-glass-strong ${styles.footer}`}>
        {previous ? (
          <Link
            href={`/courses/${course.id}/study/${previous.material.id}`}
            className={styles.navButton}
            aria-label={t('study.previous')}
          >
            ← <span className={styles.navLabel}>{t('study.previous')}</span>
          </Link>
        ) : (
          <span />
        )}

        {current.material.type !== 'exam' ? (
          <button
            className={isCompleted ? styles.checkToggleDone : styles.checkToggle}
            onClick={isCompleted ? handleUnmark : handleComplete}
            aria-label={t(isCompleted ? 'study.unmarkComplete' : 'study.markComplete')}
            aria-pressed={isCompleted}
            title={t(isCompleted ? 'study.unmarkComplete' : 'study.markComplete')}
          >
            ✓
          </button>
        ) : null}

        {next ? (
          <button
            className={styles.navButtonPrimary}
            onClick={handleNext}
            aria-label={t('study.next')}
          >
            <span className={styles.navLabel}>{t('study.next')}</span> →
          </button>
        ) : (
          <span />
        )}
      </footer>
    </div>
  );
}
