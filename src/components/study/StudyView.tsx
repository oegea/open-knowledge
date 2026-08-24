'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { IconBionic, IconCheck, IconChevronDown, IconRsvp } from '../ui/icons';
import { WORD_ATTRIBUTE } from '../shared/rehypeWordSpans';
import { MaterialRenderer } from './MaterialRenderer';
import { ReadingProgress } from './ReadingProgress';
import { RsvpNarration, RsvpReader } from './RsvpReader';
import { useBionicReading } from './useBionicReading';
import styles from './StudyView.module.css';

interface StudyViewProps {
  course: CoursePrimitive;
  currentMaterialId: string;
  authenticated: boolean;
  /** False in static content mode: no register hint, no certificates. */
  identityEnabled?: boolean;
}

interface FlatMaterial {
  material: MaterialPrimitive;
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
}

export function StudyView({
  course,
  currentMaterialId,
  authenticated,
  identityEnabled = true,
}: StudyViewProps) {
  // URLs use the SEO slug; local/remote progress stays keyed by course id.
  const courseRef = course.slug || course.id!;
  const { t } = useI18n();
  const router = useRouter();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [footerHidden, setFooterHidden] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  // Hosts the mini player of audio/video materials while their player is
  // scrolled away; sits above the navigation footer, where players belong.
  const [playerDock, setPlayerDock] = useState<HTMLElement | null>(null);
  // RSVP reading mode (ADR 0018): non-null while the reader is open, holding
  // the display tokens captured from the rendered word spans.
  const [rsvpWords, setRsvpWords] = useState<string[] | null>(null);
  // Bionic reading (ADR 0019): a device preference, off until hydration.
  const [bionic, toggleBionic] = useBionicReading();
  // Narration of the current material (media + transcript), reported by
  // MediaMaterial so the RSVP reader can offer the audio as pace source.
  const [narration, setNarration] = useState<RsvpNarration | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
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
    router.push(`/courses/${courseRef}/study/${next.material.id}`);
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

  // The reader consumes the words React already rendered (the same spans
  // NarratedProse aligns to), so what is read is exactly what is displayed.
  const openRsvp = useCallback(() => {
    const container = contentRef.current;
    if (!container) return;
    const words = Array.from(
      container.querySelectorAll<HTMLElement>(`[${WORD_ATTRIBUTE}]`),
      (span) => span.textContent ?? ''
    );
    if (words.length > 0) setRsvpWords(words);
  }, []);

  // Leaving the reader lands the page on the word the reading stopped at.
  const closeRsvp = useCallback((wordIndex: number) => {
    setRsvpWords(null);
    window.setTimeout(() => {
      const span = contentRef.current?.querySelectorAll<HTMLElement>(`[${WORD_ATTRIBUTE}]`)[
        wordIndex
      ];
      if (!span) return;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      span.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }, 0);
  }, []);

  const handleRsvpNext = useCallback(() => {
    setRsvpWords(null);
    void handleNext();
  }, [handleNext]);

  const refreshProgress = useCallback(async () => {
    setProgress(
      await getCourseProgress({ courseId: course.id!, progressRepository })
    );
  }, [course.id, progressRepository]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  // Registered users get their attempt graded and recorded server-side.
  // Reader-style chrome on phones: the nav bar hides while scrolling down,
  // returns on the first upward gesture, and stays put near the end of the
  // material (where the continue action lives). Desktop keeps it always on.
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const y = window.scrollY;
      const nearBottom =
        window.innerHeight + y >= document.documentElement.scrollHeight - 120;
      if (nearBottom || y < 80 || y < lastY - 4) {
        setFooterHidden(false);
      } else if (y > lastY + 4) {
        setFooterHidden(true);
      }
      lastY = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentMaterialId]);

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

  // RSVP works on any material with text: markdown lessons, and audio/video
  // only when they carry notes. Exams are answered, not read.
  const rsvpEligible =
    current.material.type !== 'exam' && current.material.markdown.trim().length > 0;

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
          href={`/courses/${courseRef}`}
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
          onClick={() => setContentsOpen(false)}
        >
          <nav
            className={`ok-glass-strong ${styles.contentsPanel}`}
            onClick={(event) => event.stopPropagation()}
          >
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
                    <span className={styles.contentsSectionLabel}>{section.title}</span>
                    {/* Collapse affordance: the chevron rotates with the
                        details' open state (see .sectionChevron). */}
                    <span className={styles.sectionChevron} aria-hidden="true">
                      <IconChevronDown width={16} height={16} />
                    </span>
                  </summary>
                  <ul className={styles.contentsMaterials}>
                    {section.materials.map((material) => {
                      const completed = progress?.isMaterialCompleted(material.id) ?? false;
                      const isCurrent = material.id === currentMaterialId;
                      return (
                        <li key={material.id}>
                          <Link
                            href={`/courses/${courseRef}/study/${material.id}`}
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

        <main className={styles.content} ref={contentRef}>
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
              ) : identityEnabled ? (
                <p className={styles.completedHint}>
                  {t('study.registerToKeep')}{' '}
                  <Link href="/register" className={styles.completedLink}>
                    {t('auth.register')}
                  </Link>
                </p>
              ) : null}
            </aside>
          ) : null}

          <div className={styles.metaRow}>
            <p className={styles.breadcrumb}>
              {current.sectionIndex + 1} · {current.sectionTitle}
              {readingMinutes !== null ? (
                <span className={styles.readingTime}>
                  {t('study.readingTime', { min: readingMinutes })}
                </span>
              ) : null}
            </p>
            {rsvpEligible ? (
              <div
                className={styles.speedReading}
                role="group"
                aria-label={t('study.speedReading')}
              >
                <button type="button" className={styles.rsvpButton} onClick={openRsvp}>
                  <IconRsvp width={18} height={18} />
                  {t('study.rsvpOpen')}
                </button>
                <button
                  type="button"
                  className={styles.rsvpButton}
                  aria-pressed={bionic}
                  onClick={toggleBionic}
                >
                  <IconBionic width={18} height={18} />
                  {t('study.bionicToggle')}
                </button>
              </div>
            ) : null}
          </div>
          <h1 className={styles.materialTitle}>{current.material.title}</h1>

          <MaterialRenderer
            key={current.material.id}
            material={current.material}
            coverImage={course.coverImage}
            playerDock={playerDock}
            bionic={bionic}
            onNarration={setNarration}
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

      {rsvpWords ? (
        <RsvpReader
          title={current.material.title}
          words={rsvpWords}
          hasNext={next !== null}
          narration={narration}
          onClose={closeRsvp}
          onFinished={handleComplete}
          onNext={handleRsvpNext}
        />
      ) : null}

      {/* Positioning and backdrop blur live on separate elements: iOS Safari
          mis-anchors position:fixed elements that carry backdrop-filter. */}
      <div
        ref={setPlayerDock}
        className={`${styles.playerDock} ${footerHidden ? styles.playerDockLowered : ''}`}
      />
      <footer className={`${styles.footer} ${footerHidden ? styles.footerHidden : ''}`}>
        <div className={`ok-glass-strong ${styles.footerInner}`}>
        {previous ? (
          <Link
            href={`/courses/${courseRef}/study/${previous.material.id}`}
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
            <IconCheck width={20} height={20} />
          </button>
        ) : (
          <span />
        )}

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
      </div>
      </footer>
    </div>
  );
}
