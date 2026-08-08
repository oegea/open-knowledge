import { notFound } from 'next/navigation';
import courseFactory from '@/modules/course/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { LOCALES } from '@/i18n/config';
import { PublicHeader } from '@/components/public/PublicHeader';
import { StartCourseButton } from '@/components/public/StartCourseButton';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({ params }: PageProps<'/courses/[id]'>) {
  const { id } = await params;
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  let course;
  try {
    course = await courseFactory.getCourse(id);
  } catch {
    notFound();
  }
  if (!course.isPublished()) notFound();

  const sections = course.getSections().getSections();
  const orderedMaterialIds = sections.flatMap((section) =>
    section.getMaterials().getMaterials().map((material) => material.getId())
  );
  const languageInfo = LOCALES.find((info) => info.code === course.getLanguage());

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <section className={`ok-glass ${styles.heroCard}`}>
          {course.getCoverImage() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.getCoverImage()!} alt="" className={styles.cover} />
          ) : null}
          <div className={styles.heroBody}>
            <div className={styles.meta}>
              <span className={styles.iso}>{languageInfo?.iso ?? course.getLanguage()}</span>
              {course.getCategory() ? (
                <span className={styles.category}>{course.getCategory()}</span>
              ) : null}
            </div>
            <h1 className={styles.title}>{course.getTitle()}</h1>
            <p className={styles.description}>{course.getDescription()}</p>

            {course.getAuthors().length > 0 ? (
              <p className={styles.attribution}>
                <strong>{translate(dictionary, 'admin.authors')}:</strong>{' '}
                {course.getAuthors().join(', ')}
              </p>
            ) : null}
            {course.getSources().length > 0 ? (
              <p className={styles.attribution}>
                <strong>{translate(dictionary, 'admin.sources')}:</strong>{' '}
                {course.getSources().join(' · ')}
              </p>
            ) : null}

            <StartCourseButton
              courseId={course.getId()!}
              orderedMaterialIds={orderedMaterialIds}
            />
          </div>
        </section>

        {course.isAiAssisted() ? (
          <aside className={`ok-glass ${styles.aiNotice}`} role="note">
            <span className={styles.aiIcon} aria-hidden="true">
              ✦
            </span>
            <div>
              <p className={styles.aiTitle}>{translate(dictionary, 'course.aiNoticeTitle')}</p>
              <p className={styles.aiText}>{translate(dictionary, 'course.aiNotice')}</p>
            </div>
          </aside>
        ) : null}

        <section className={styles.contents}>
          <h2 className={styles.contentsTitle}>
            {translate(dictionary, 'course.contents')}
            <span className={styles.contentsCount}>
              {translate(dictionary, 'course.materialsCount', {
                count: orderedMaterialIds.length,
              })}
            </span>
          </h2>

          <ol className={styles.sectionList}>
            {sections.map((section, index) => (
              <li key={section.getId()} className={`ok-glass ${styles.section}`}>
                <p className={styles.sectionTitle}>
                  <span className={styles.sectionNumber}>{index + 1}</span>
                  {section.getTitle()}
                </p>
                <ol className={styles.materialList}>
                  {section
                    .getMaterials()
                    .getMaterials()
                    .map((material) => (
                      <li key={material.getId()} className={styles.materialItem}>
                        <span className={styles.materialType}>
                          {translate(dictionary, `material.type.${material.getType()}`)}
                        </span>
                        {material.getTitle()}
                      </li>
                    ))}
                </ol>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
