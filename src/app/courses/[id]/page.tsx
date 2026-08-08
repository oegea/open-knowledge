import Link from 'next/link';
import { notFound } from 'next/navigation';
import courseFactory from '@/modules/course/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { LOCALES } from '@/i18n/config';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { StartCourseButton } from '@/components/public/StartCourseButton';
import { getCurrentUser } from '@/app/serverAuth';
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
              <div className={styles.bibliography}>
                <strong>{translate(dictionary, 'course.bibliography')}</strong>
                <ul className={styles.bibliographyList}>
                  {course.getSources().map((source, index) => (
                    <li key={index}>
                      {source.getUrl() ? (
                        <a
                          href={source.getUrl()!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.bibliographyLink}
                        >
                          {source.getTitle()} ↗
                        </a>
                      ) : (
                        source.getTitle()
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <StartCourseButton
              courseId={course.getId()!}
              orderedMaterialIds={orderedMaterialIds}
              authenticated={(await getCurrentUser()) !== null}
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
                      <li key={material.getId()}>
                        <Link
                          href={`/courses/${course.getId()}/study/${material.getId()}`}
                          className={styles.materialItem}
                        >
                          <span className={styles.materialType}>
                            {translate(dictionary, `material.type.${material.getType()}`)}
                          </span>
                          <span className={styles.materialItemTitle}>{material.getTitle()}</span>
                          <span className={styles.materialArrow} aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                </ol>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
