import { notFound } from 'next/navigation';
import courseFactory from '@/modules/course/application/factory';
import { getCurrentUser } from '@/app/serverAuth';
import { ResumeRedirect } from '@/components/study/ResumeRedirect';

export const dynamic = 'force-dynamic';

export default async function StudyResumePage({ params }: PageProps<'/courses/[id]/study'>) {
  const { id } = await params;

  let course;
  try {
    course = await courseFactory.getCourse(id);
  } catch {
    notFound();
  }
  if (!course.isPublished()) notFound();

  const orderedMaterialIds = course
    .getSections()
    .getSections()
    .flatMap((section) => section.getMaterials().getMaterials().map((material) => material.getId()));
  if (orderedMaterialIds.length === 0) notFound();

  const user = await getCurrentUser();

  return (
    <ResumeRedirect
      courseId={id}
      orderedMaterialIds={orderedMaterialIds}
      authenticated={user !== null}
    />
  );
}
