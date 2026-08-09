import { notFound, permanentRedirect } from 'next/navigation';
import courseFactory from '@/modules/course/application/factory';
import { getCurrentUser } from '@/app/serverAuth';
import { isStaticMode } from '@/modules/shared/infrastructure/StaticContentClient';
import { StudyView } from '@/components/study/StudyView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/courses/[id]/study/[materialId]'>) {
  try {
    const { id, materialId } = await params;
    const course = await courseFactory.getCourse(id);
    const material = course
      .getSections()
      .getSections()
      .map((section) => section.getMaterials().getMaterialById(materialId))
      .find((found) => found !== null);
    return { title: material ? `${material.getTitle()} · ${course.getTitle()}` : course.getTitle() };
  } catch {
    return {};
  }
}

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

  if (course.getSlug() && id !== course.getSlug()) {
    permanentRedirect(`/courses/${course.getSlug()}/study/${materialId}`);
  }

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
      identityEnabled={!isStaticMode()}
    />
  );
}
