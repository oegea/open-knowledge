import Link from 'next/link';
import courseFactory from '@/modules/course/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const courses = await courseFactory.listCourses();

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{translate(dictionary, 'admin.courses')}</h1>
        <Link href="/admin/new" className={styles.newButton}>
          + {translate(dictionary, 'admin.newCourse')}
        </Link>
      </div>

      {courses.isEmpty() ? (
        <p className={`ok-glass ${styles.empty}`}>{translate(dictionary, 'admin.noCourses')}</p>
      ) : (
        <ul className={styles.list}>
          {courses.getCourses().map((course) => (
            <li key={course.getId()}>
              <Link
                href={`/admin/courses/${course.getId()}`}
                className={`ok-glass ${styles.courseCard}`}
              >
                {course.getCoverImage() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.getCoverImage()!}
                    alt=""
                    className={styles.cover}
                    loading="lazy"
                  />
                ) : (
                  <span className={styles.coverPlaceholder} aria-hidden="true" />
                )}
                <span className={styles.courseInfo}>
                  <span className={styles.courseTitle}>{course.getTitle()}</span>
                  <span className={styles.courseMeta}>
                    <span className={styles.languageTag}>{course.getLanguage().toUpperCase()}</span>
                    {course.getCategory() ? <span>{course.getCategory()}</span> : null}
                  </span>
                </span>
                <span
                  className={course.isPublished() ? styles.badgePublished : styles.badgeDraft}
                >
                  {translate(dictionary, course.isPublished() ? 'admin.published' : 'admin.draft')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
