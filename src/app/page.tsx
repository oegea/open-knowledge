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
import {
  PageTransition,
  SharedElement,
  categoryTransition,
  courseCoverTransition,
} from '@/components/ui/PageTransition';
import { LOCALES } from '@/i18n/config';
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

  // The newest course is featured in the hero as a full, readable card.
  const heroImage = settings.getHeroImagePath();
  const latest = heroImage ? null : (allPublished.getCourses()[0] ?? null);

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
              latest ? styles.heroWithFeature : ''
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
            </div>
            {latest ? (
              <Link
                href={`/courses/${latest.getSlug() || latest.getId()}`}
                className={`ok-glass ${styles.feature}`}
                aria-label={`${translate(dictionary, 'landing.latestCourse')}: ${latest.getTitle()}`}
                data-spotlight
                data-tilt
              >
                <SharedElement name={courseCoverTransition(latest.getId()!)}>
                  <span className={styles.featureCoverWrap}>
                    {latest.getCoverImage() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={latest.getCoverImage()!} alt="" className={styles.featureCover} />
                    ) : (
                      <span className={styles.cardCoverFallback} aria-hidden="true" />
                    )}
                  </span>
                </SharedElement>
                <span className={styles.featureBody}>
                  <span className={styles.featureLabel}>
                    {translate(dictionary, 'landing.latestCourse')}
                  </span>
                  <span className={styles.featureTitle}>{latest.getTitle()}</span>
                  <span className={styles.featureDescription}>{latest.getDescription()}</span>
                  <span className={styles.featureMeta}>
                    <span className={styles.featureIso}>
                      {LOCALES.find((entry) => entry.code === latest.getLanguage())?.iso ??
                        latest.getLanguage().toUpperCase()}
                    </span>
                    {latest.getCategory() ? <span>{latest.getCategory()}</span> : null}
                    <span className={styles.featureArrow} aria-hidden="true">
                      →
                    </span>
                  </span>
                </span>
              </Link>
            ) : null}
          </section>

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
                      <SharedElement name={categoryTransition(category.name)}>
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
                      </SharedElement>
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
