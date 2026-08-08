import { notFound } from 'next/navigation';
import courseFactory from '@/modules/course/application/factory';
import { getCurrentUser } from '@/app/serverAuth';
import { StudyView } from '@/components/study/StudyView';

export const dynamic = 'force-dynamic';

export default async function StudyMaterialPage({
  params,
}: PageProps<'/courses/[id]/study/[materialId]'>) {
  const { id, materialId } = await params;

  let course;
  try {
    course = await courseFactory.getCourse(id);
  } catch {
    notFound();
  }
  if (!course.isPublished()) notFound();

  const materialExists = course
    .getSections()
    .getSections()
    .some((section) => section.getMaterials().getMaterialById(materialId) !== null);
  if (!materialExists) notFound();

  const user = await getCurrentUser();

  return (
    <StudyView
      course={course.toPrimitive()}
      currentMaterialId={materialId}
      authenticated={user !== null}
    />
  );
}
