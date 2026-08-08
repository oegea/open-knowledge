'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseProgress } from '@/modules/study/application/getCourseProgress';
import { LocalStorageProgressRepository } from '@/modules/study/infrastructure/LocalStorageProgressRepository';
import { HttpProgressRepository } from '@/modules/study/infrastructure/HttpProgressRepository';

interface ResumeRedirectProps {
  courseId: string;
  /** Slug (or id) used to build study URLs; progress stays keyed by id. */
  courseRef: string;
  orderedMaterialIds: string[];
  authenticated: boolean;
}

/**
 * Landing on /study without a material takes the student to the natural
 * continuation point: the first pending material.
 */
export function ResumeRedirect({
  courseId,
  courseRef,
  orderedMaterialIds,
  authenticated,
}: ResumeRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const progress = await getCourseProgress({
        courseId,
        progressRepository: authenticated
          ? new HttpProgressRepository()
          : new LocalStorageProgressRepository(),
      });
      const target = progress.nextPendingMaterialId(orderedMaterialIds) ?? orderedMaterialIds[0];
      router.replace(`/courses/${courseRef}/study/${target}`);
    })();
  }, [authenticated, courseId, courseRef, orderedMaterialIds, router]);

  return null;
}
