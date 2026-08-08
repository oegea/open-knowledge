/**
 * Sanitized URL slugs for public content (courses, news, auxiliary pages).
 * Lowercase ASCII, words separated by single hyphens; diacritics stripped.
 * Non-latin titles (e.g. Chinese) may sanitize to nothing — callers fall
 * back to a neutral base so the slug is never empty.
 */
export function slugify(text: string, fallback: string = 'untitled'): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return slug || fallback;
}

/**
 * Appends -2, -3, … until `isTaken` reports the candidate as free. Callers
 * exclude the entity being renamed from the check so it can keep its slug.
 */
export async function ensureUniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  let candidate = base;
  for (let suffix = 2; await isTaken(candidate); suffix++) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
