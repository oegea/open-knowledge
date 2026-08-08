'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseProgress } from '@/modules/study/application/getCourseProgress';
import { LocalStorageProgressRepository } from '@/modules/study/infrastructure/LocalStorageProgressRepository';

interface ResumeRedirectProps {
  courseId: string;
  orderedMaterialIds: string[];
}

/**
 * Landing on /study without a material takes the student to the natural
 * continuation point: the first pending material.
 */
export function ResumeRedirect({ courseId, orderedMaterialIds }: ResumeRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const progress = await getCourseProgress({
        courseId,
        progressRepository: new LocalStorageProgressRepository(),
      });
      const target = progress.nextPendingMaterialId(orderedMaterialIds) ?? orderedMaterialIds[0];
      router.replace(`/courses/${courseId}/study/${target}`);
    })();
  }, [courseId, orderedMaterialIds, router]);

  return null;
}
