'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCourseProgress } from '@/modules/study/application/getCourseProgress';
import { LocalStorageProgressRepository } from '@/modules/study/infrastructure/LocalStorageProgressRepository';
import { HttpProgressRepository } from '@/modules/study/infrastructure/HttpProgressRepository';
import { IconAudio, IconCheck, IconExam, IconPage, IconVideo } from '../ui/icons';
import styles from '@/app/courses/[id]/page.module.css';

const TYPE_ICONS = {
  markdown: IconPage,
  audio: IconAudio,
  video: IconVideo,
  exam: IconExam,
} as const;

export interface ContentsSection {
  id: string;
  title: string;
  materials: { id: string; title: string; type: string; typeLabel: string }[];
}

interface CourseContentsProps {
  courseId: string;
  courseRef: string;
  authenticated: boolean;
  completedLabel: string;
  sections: ContentsSection[];
}

/**
 * The contents list knows the visitor's progress: completed materials show
 * a check, exactly like the study-mode panel, so "where was I?" is answered
 * before pressing continue.
 */
export function CourseContents({
  courseId,
  courseRef,
  authenticated,
  completedLabel,
  sections,
}: CourseContentsProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      const progress = await getCourseProgress({
        courseId,
        progressRepository: authenticated
          ? new HttpProgressRepository()
          : new LocalStorageProgressRepository(),
      });
      if (active) setCompleted(new Set(progress.getCompletedMaterialIds()));
    })();
    return () => {
      active = false;
    };
  }, [courseId, authenticated]);

  return (
    <ol className={styles.sectionList}>
      {sections.map((section, index) => (
        <li key={section.id} className={`ok-glass ${styles.section}`}>
          <p className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>{index + 1}</span>
            {section.title}
          </p>
          <ol className={styles.materialList}>
            {section.materials.map((material) => {
              const isDone = completed.has(material.id);
              const Icon = TYPE_ICONS[material.type as keyof typeof TYPE_ICONS] ?? IconPage;
              return (
                <li key={material.id}>
                  <Link
                    href={`/courses/${courseRef}/study/${material.id}`}
                    className={`${styles.materialItem} ${isDone ? styles.materialItemDone : ''}`}
                  >
                    <span
                      className={styles.materialTypeIcon}
                      title={material.typeLabel}
                      aria-label={material.typeLabel}
                    >
                      <Icon width={17} height={17} />
                    </span>
                    <span className={styles.materialType} aria-hidden="true">
                      {material.typeLabel}
                    </span>
                    <span className={styles.materialItemTitle}>{material.title}</span>
                    {isDone ? (
                      <span className={styles.materialDoneCheck} aria-label={completedLabel}>
                        <IconCheck width={14} height={14} />
                      </span>
                    ) : (
                      <span className={styles.materialArrow} aria-hidden="true">
                        →
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}
