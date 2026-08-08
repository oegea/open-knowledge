import { notFound } from 'next/navigation';
import courseFactory from '@/modules/course/application/factory';
import { CourseEditor } from '@/components/admin/CourseEditor';

export const dynamic = 'force-dynamic';

export default async function AdminCoursePage({ params }: PageProps<'/admin/courses/[id]'>) {
  const { id } = await params;

  let course;
  try {
    course = await courseFactory.getCourse(id);
  } catch {
    notFound();
  }

  return <CourseEditor initialCourse={course.toPrimitive()} />;
}
