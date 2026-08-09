import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound, permanentRedirect } from 'next/navigation';
import courseFactory from '@/modules/course/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { LOCALES, isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { ActionMenu } from '@/components/public/ActionMenu';
import { CourseContents } from '@/components/public/CourseContents';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { StartCourseButton } from '@/components/public/StartCourseButton';
import { getCurrentUser } from '@/app/serverAuth';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/courses/[id]'>) {
  try {
    const { id } = await params;
    const course = await courseFactory.getCourse(id);
    return { title: course.getTitle() };
  } catch {
    return {};
  }
}

/** Keeps the external-link arrow glued to the title's last word. */
function sourceTitleWithArrow(title: string) {
  const words = title.trim().split(' ');
  const last = words.pop();
  return (
    <>
      {words.length > 0 ? `${words.join(' ')} ` : ''}
      <span style={{ whiteSpace: 'nowrap' }}>{last} ↗</span>
    </>
  );
}

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

  // Canonical URL is the slug; old id links redirect permanently.
  const courseRef = course.getSlug() || course.getId()!;
  if (course.getSlug() && id !== course.getSlug()) {
    permanentRedirect(`/courses/${course.getSlug()}`);
  }

  // The tutor links hand an AI assistant the plain-text edition of the
  // course; the prompt speaks the course's language, not the visitor's.
  const headerList = await headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  const llmsUrl = `${protocol}://${host}/courses/${courseRef}/llms.txt`;
  const courseLanguage = course.getLanguage();
  const courseLocale = isLocale(courseLanguage) ? courseLanguage : DEFAULT_LOCALE;
  const courseDictionary = await getDictionary(courseLocale);
  const tutorPrompt = translate(courseDictionary, 'course.tutorPrompt', {
    title: course.getTitle(),
    url: llmsUrl,
  });
  const tutorQuery = encodeURIComponent(tutorPrompt);

  const user = await getCurrentUser();
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
                courseRef={courseRef}
                orderedMaterialIds={orderedMaterialIds}
                authenticated={user !== null}
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

            <CourseContents
              courseId={course.getId()!}
              courseRef={courseRef}
              authenticated={user !== null}
              completedLabel={translate(dictionary, 'study.completed')}
              sections={sections.map((section) => ({
                id: section.getId()!,
                title: section.getTitle(),
                materials: section
                  .getMaterials()
                  .getMaterials()
                  .map((material) => ({
                    id: material.getId()!,
                    title: material.getTitle(),
                    type: material.getType(),
                    typeLabel: translate(dictionary, `material.type.${material.getType()}`),
                  })),
              }))}
            />
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
                <ActionMenu
                  label={`↓ ${translate(dictionary, 'course.download')}`}
                  items={[
                    { label: 'EPUB', href: `/api/courses/${courseRef}/export/epub`, download: true },
                    { label: 'PDF', href: `/api/courses/${courseRef}/export/pdf`, download: true },
                  ]}
                />
                <ActionMenu
                  label={`✦ ${translate(dictionary, 'course.studyWithAi')}`}
                  items={[
                    { label: 'ChatGPT', href: `https://chatgpt.com/?q=${tutorQuery}`, external: true },
                    { label: 'Claude', href: `https://claude.ai/new?q=${tutorQuery}`, external: true },
                  ]}
                />
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
                            {sourceTitleWithArrow(source.getTitle())}
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
