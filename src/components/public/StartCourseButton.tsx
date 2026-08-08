'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCourseProgress } from '@/modules/study/application/getCourseProgress';
import { LocalStorageProgressRepository } from '@/modules/study/infrastructure/LocalStorageProgressRepository';
import { HttpProgressRepository } from '@/modules/study/infrastructure/HttpProgressRepository';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './StartCourseButton.module.css';

interface StartCourseButtonProps {
  courseId: string;
  orderedMaterialIds: string[];
  authenticated: boolean;
}

export function StartCourseButton({
  courseId,
  orderedMaterialIds,
  authenticated,
}: StartCourseButtonProps) {
  const { t } = useI18n();
  const [started, setStarted] = useState(false);
  const [target, setTarget] = useState<string | null>(orderedMaterialIds[0] ?? null);
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const progress = await getCourseProgress({
        courseId,
        progressRepository: authenticated
          ? new HttpProgressRepository()
          : new LocalStorageProgressRepository(),
      });
      if (!active) return;
      setStarted(progress.getCompletedMaterialIds().length > 0);
      setTarget(progress.nextPendingMaterialId(orderedMaterialIds));
      setRatio(progress.completionRatio(orderedMaterialIds));
    })();
    return () => {
      active = false;
    };
  }, [authenticated, courseId, orderedMaterialIds]);

  if (!target) return null;

  return (
    <div className={styles.container}>
      <Link href={`/courses/${courseId}/study/${target}`} className={styles.button}>
        {started ? t('course.continue') : t('course.start')}
      </Link>
      {started ? (
        <div className={styles.progressWrap}>
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
          <span className={styles.progressText}>{Math.round(ratio * 100)}%</span>
        </div>
      ) : null}
    </div>
  );
}
