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
  const cover = course.getCoverImage();

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        {/* Immersive hero: the cover becomes the atmosphere of the page. */}
        <section className={styles.hero}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className={styles.heroBackdrop} aria-hidden="true" />
          ) : null}
          <div className={styles.heroScrim} aria-hidden="true" />
          <div className={styles.heroContent}>
            <div className={styles.heroInfo}>
              <div className={styles.heroMeta}>
                <span className={styles.heroIso}>
                  {languageInfo?.iso ?? course.getLanguage()}
                </span>
                {course.getCategory() ? (
                  <span className={styles.heroCategory}>{course.getCategory()}</span>
                ) : null}
              </div>
              <h1 className={styles.heroTitle}>{course.getTitle()}</h1>
              <p className={styles.heroDescription}>{course.getDescription()}</p>
              <StartCourseButton
                courseId={course.getId()!}
                orderedMaterialIds={orderedMaterialIds}
                authenticated={(await getCurrentUser()) !== null}
              />
            </div>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className={styles.heroCover} />
            ) : null}
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

        <div className={styles.layout}>
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

          <aside className={styles.aside}>
            <div className={`ok-glass ${styles.asideCard}`}>
              <h2 className={styles.asideTitle}>
                {translate(dictionary, 'course.aboutCourse')}
              </h2>

              <dl className={styles.facts}>
                <div className={styles.fact}>
                  <dt>{translate(dictionary, 'admin.courseLanguage')}</dt>
                  <dd>{languageInfo?.nativeName ?? course.getLanguage()}</dd>
                </div>
                {course.getCategory() ? (
                  <div className={styles.fact}>
                    <dt>{translate(dictionary, 'admin.category')}</dt>
                    <dd>{course.getCategory()}</dd>
                  </div>
                ) : null}
                <div className={styles.fact}>
                  <dt>{translate(dictionary, 'course.contents')}</dt>
                  <dd>
                    {translate(dictionary, 'course.materialsCount', {
                      count: orderedMaterialIds.length,
                    })}
                  </dd>
                </div>
                {course.getLicense() ? (
                  <div className={styles.fact}>
                    <dt>{translate(dictionary, 'course.license')}</dt>
                    <dd>{course.getLicense()}</dd>
                  </div>
                ) : null}
              </dl>

              {course.getAuthors().length > 0 ? (
                <div className={styles.asideBlock}>
                  <h3 className={styles.asideBlockTitle}>
                    {translate(dictionary, 'admin.authors')}
                  </h3>
                  <p className={styles.asideText}>{course.getAuthors().join(', ')}</p>
                </div>
              ) : null}

              <div className={styles.downloads}>
                <a
                  href={`/api/courses/${course.getId()}/export/epub`}
                  className={styles.downloadButton}
                  download
                >
                  ↓ {translate(dictionary, 'course.downloadEpub')}
                </a>
                <a
                  href={`/api/courses/${course.getId()}/export/pdf`}
                  className={styles.downloadButton}
                  download
                >
                  ↓ {translate(dictionary, 'course.downloadPdf')}
                </a>
              </div>

              {course.getSources().length > 0 ? (
                <div className={styles.asideBlock}>
                  <h3 className={styles.asideBlockTitle}>
                    {translate(dictionary, 'course.bibliography')}
                  </h3>
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
            </div>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
