import Link from 'next/link';
import courseFactory from '@/modules/course/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { LOCALES } from '@/i18n/config';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { IconSearch } from '@/components/ui/icons';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: PageProps<'/courses'>) {
  const dictionary = await getDictionary(await getLocale());
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  return { title: category ?? translate(dictionary, 'library.title') };
}

export default async function CoursesPage({ searchParams }: PageProps<'/courses'>) {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const params = await searchParams;
  const languageFilter = typeof params.language === 'string' ? params.language : undefined;
  const categoryFilter = typeof params.category === 'string' ? params.category : undefined;
  const queryFilter = typeof params.q === 'string' ? params.q : undefined;

  const allPublished = await courseFactory.listCourses({ publishedOnly: true });
  const courses = await courseFactory.listCourses({
    publishedOnly: true,
    language: languageFilter,
    category: categoryFilter,
    query: queryFilter,
  });

  const availableLanguages = [
    ...new Set(allPublished.getCourses().map((course) => course.getLanguage())),
  ];
  const availableCategories = allPublished.getCategories();

  const filterHref = (language?: string, category?: string) => {
    const query = new URLSearchParams();
    if (language) query.set('language', language);
    if (category) query.set('category', category);
    if (queryFilter) query.set('q', queryFilter);
    const value = query.toString();
    return value ? `/courses?${value}` : '/courses';
  };

  return (
    <>
      <PublicHeader backHref="/" />
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>
          {categoryFilter ?? translate(dictionary, 'library.title')}
        </h1>

        <form className={styles.search} action="/courses" method="get" role="search">
          {languageFilter ? <input type="hidden" name="language" value={languageFilter} /> : null}
          {categoryFilter ? <input type="hidden" name="category" value={categoryFilter} /> : null}
          <IconSearch className={styles.searchIcon} />
          <input
            type="search"
            name="q"
            defaultValue={queryFilter ?? ''}
            placeholder={translate(dictionary, 'library.searchPlaceholder')}
            aria-label={translate(dictionary, 'common.search')}
            className={styles.searchInput}
          />
        </form>

        {availableLanguages.length > 0 || availableCategories.length > 0 ? (
          <nav className={styles.filters} aria-label={translate(dictionary, 'common.search')}>
            {availableLanguages.length > 0 ? (
              <div className={styles.filterRow}>
                <Link
                  href={filterHref(undefined, categoryFilter)}
                  className={styles.chip}
                  aria-current={!languageFilter ? 'true' : undefined}
                >
                  {translate(dictionary, 'library.all')}
                </Link>
                {availableLanguages.map((language) => {
                  const info = LOCALES.find((candidate) => candidate.code === language);
                  return (
                    <Link
                      key={language}
                      href={filterHref(language, categoryFilter)}
                      className={styles.chip}
                      aria-current={languageFilter === language ? 'true' : undefined}
                    >
                      <span className={styles.chipIso}>{info?.iso ?? language.toUpperCase()}</span>
                      {info?.nativeName ?? language}
                    </Link>
                  );
                })}
              </div>
            ) : null}

            {availableCategories.length > 0 ? (
              <div className={styles.filterRow}>
                {availableCategories.map((category) => (
                  <Link
                    key={category}
                    href={filterHref(
                      languageFilter,
                      categoryFilter === category ? undefined : category
                    )}
                    className={styles.chip}
                    aria-current={categoryFilter === category ? 'true' : undefined}
                  >
                    {category}
                  </Link>
                ))}
              </div>
            ) : null}
          </nav>
        ) : null}

        {courses.isEmpty() ? (
          <p className={`ok-glass ${styles.empty}`}>{translate(dictionary, 'library.empty')}</p>
        ) : (
          <ul className={styles.grid}>
            {courses.getCourses().map((course) => (
              <li key={course.getId()}>
                <Link href={`/courses/${course.getSlug() || course.getId()}`} className={`ok-glass ${styles.card}`}>
                  <span className={styles.cardCoverWrap}>
                    {course.getCoverImage() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.getCoverImage()!}
                        alt=""
                        className={styles.cardCover}
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.cardCoverFallback} aria-hidden="true" />
                    )}
                    <span className={styles.cardCoverScrim} aria-hidden="true" />
                    <span className={styles.cardMeta}>
                      <span className={styles.cardIso}>{course.getLanguage().toUpperCase()}</span>
                      {course.getCategory() ? (
                        <span className={styles.cardCategory}>{course.getCategory()}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className={styles.cardBody}>
                    <span className={styles.cardTitle}>{course.getTitle()}</span>
                    <span className={styles.cardDescription}>{course.getDescription()}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
