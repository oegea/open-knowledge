'use client';

import { MaterialPrimitive } from '@/modules/course/domain/Material';
import { Prose } from '../shared/Prose';
import { ExamPlayer } from './ExamPlayer';
import { MediaMaterial } from './MediaMaterial';

interface MaterialRendererProps {
  material: MaterialPrimitive;
  /** Course cover, used as artwork behind the audio player. */
  coverImage?: string | null;
  /** Host for the mini player of audio/video materials (see MediaMaterial). */
  playerDock?: HTMLElement | null;
  onExamPassed: () => Promise<void> | void;
  onExamFinished?: (answers: Record<string, string>, passed: boolean) => Promise<void> | void;
}

export function MaterialRenderer({
  material,
  coverImage,
  playerDock,
  onExamPassed,
  onExamFinished,
}: MaterialRendererProps) {
  switch (material.type) {
    case 'markdown':
      return <Prose content={material.markdown} />;

    case 'audio':
    case 'video':
      return <MediaMaterial material={material} coverImage={coverImage} playerDock={playerDock} />;

    case 'exam':
      return material.exam ? (
        <ExamPlayer exam={material.exam} onPassed={onExamPassed} onFinished={onExamFinished} />
      ) : null;
  }
}
