import Link from 'next/link';
import { redirect } from 'next/navigation';
import courseFactory from '@/modules/course/application/factory';
import categoryFactory from '@/modules/category/application/factory';
import settingsFactory from '@/modules/settings/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { IconLibrary, IconSearch } from '@/components/ui/icons';
import { PageTransition, SharedElement, courseCoverTransition } from '@/components/ui/PageTransition';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function LandingPage({ searchParams }: PageProps<'/'>) {
  const params = await searchParams;

  // The course catalog used to live on `/` — keep old filter links working.
  const legacy = new URLSearchParams();
  for (const key of ['language', 'category', 'q']) {
    const value = params[key];
    if (typeof value === 'string') legacy.set(key, value);
  }
  if ([...legacy.keys()].length > 0) {
    redirect(`/courses?${legacy.toString()}`);
  }

  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  const settings = await settingsFactory.getInstanceSettings();
  const allPublished = await courseFactory.listCourses({ publishedOnly: true });
  const managedCategories = await categoryFactory.listCategories();

  const counts = allPublished.getCategoryCounts();
  const categoryCards = Object.keys(counts)
    .map((name) => ({
      name,
      count: counts[name],
      imagePath:
        managedCategories.find((category) => category.getName() === name)?.getImagePath() ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  // Up to three covers float in the hero as a way into the newest courses.
  const heroImage = settings.getHeroImagePath();
  const featured = heroImage
    ? []
    : allPublished
        .getCourses()
        .filter((course) => course.getCoverImage())
        .slice(0, 3);

  const countLabel = (count: number) =>
    count === 1
      ? translate(dictionary, 'landing.courseCountOne')
      : translate(dictionary, 'landing.courseCount', { count });

  return (
    <>
      <PublicHeader />
      <PageTransition>
        <main className={styles.main}>
          <section
            className={`${styles.hero} ${heroImage ? styles.heroWithImage : ''} ${
              featured.length > 0 ? styles.heroWithStack : ''
            }`}
            data-parallax
          >
            {settings.getHeroImagePath() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.getHeroImagePath()!}
                alt=""
                aria-hidden="true"
                className={styles.heroImage}
              />
            ) : (
              <div className={styles.heroAurora} aria-hidden="true">
                <span className={styles.auroraBlob} />
                <span className={styles.auroraBlobAlt} />
                <span className={styles.auroraRing} />
              </div>
            )}
            <div className={styles.heroScrim} aria-hidden="true" />
            <div className={styles.heroInner}>
              <h1 className={styles.heroTitle}>
                {settings.getHeroTitle() || translate(dictionary, 'home.tagline')}
              </h1>
              <p className={styles.heroText}>
                {settings.getHeroText() || translate(dictionary, 'home.description')}
              </p>
              {allPublished.count() > 0 ? (
                <p className={styles.heroCount}>
                  {allPublished.count() === 1
                    ? translate(dictionary, 'library.courseCountOne')
                    : translate(dictionary, 'library.courseCount', { count: allPublished.count() })}
                </p>
              ) : null}
            </div>
            {featured.length > 0 ? (
              <div className={styles.heroStack}>
                {featured.map((course) => (
                  <Link
                    key={course.getId()}
                    href={`/courses/${course.getSlug() || course.getId()}`}
                    className={styles.stackCard}
                    aria-label={course.getTitle()}
                  >
                    {/* The face floats; the link around it stays put, so the
                        tap target never moves under a finger or a pointer. */}
                    <span className={styles.stackFace}>
                      <SharedElement name={courseCoverTransition(course.getId()!)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={course.getCoverImage()!} alt="" className={styles.stackCover} />
                      </SharedElement>
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>

          <form className={styles.search} action="/courses" method="get" role="search">
            <IconSearch className={styles.searchIcon} />
            <input
              type="search"
              name="q"
              placeholder={translate(dictionary, 'library.searchPlaceholder')}
              aria-label={translate(dictionary, 'common.search')}
              className={styles.searchInput}
            />
          </form>

          {allPublished.isEmpty() ? (
            <p className={`ok-glass ${styles.empty}`}>{translate(dictionary, 'library.empty')}</p>
          ) : (
            <section aria-labelledby="landing-categories">
              <h2 id="landing-categories" className={styles.sectionTitle}>
                {translate(dictionary, 'landing.categories')}
              </h2>
              <ul className={styles.grid}>
                {categoryCards.map((category) => (
                  <li key={category.name} data-reveal>
                    <Link
                      href={`/courses?category=${encodeURIComponent(category.name)}`}
                      className={`ok-glass ${styles.card}`}
                      data-spotlight
                      data-tilt
                    >
                      <span className={styles.cardCoverWrap}>
                        {category.imagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={category.imagePath}
                            alt=""
                            className={styles.cardCover}
                            loading="lazy"
                          />
                        ) : (
                          <span className={styles.cardCoverFallback} aria-hidden="true">
                            <span className={styles.cardFallbackInitial}>
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          </span>
                        )}
                        <span className={styles.cardCoverScrim} aria-hidden="true" />
                      </span>
                      <span className={styles.cardBody}>
                        <span className={styles.cardTitle}>{category.name}</span>
                        <span className={styles.cardCount}>{countLabel(category.count)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                <li data-reveal>
                  <Link
                    href="/courses"
                    className={`ok-glass ${styles.card} ${styles.viewAllCard}`}
                    data-spotlight
                    data-tilt
                  >
                    <span className={`${styles.cardCoverWrap} ${styles.viewAllCover}`}>
                      <IconLibrary className={styles.viewAllIcon} />
                    </span>
                    <span className={styles.cardBody}>
                      <span className={styles.cardTitle}>
                        {translate(dictionary, 'landing.viewAll')}
                      </span>
                      <span className={styles.cardCount}>{countLabel(allPublished.count())}</span>
                    </span>
                  </Link>
                </li>
              </ul>
            </section>
          )}
        </main>
      </PageTransition>
      <PublicFooter />
    </>
  );
}
