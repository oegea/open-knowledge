import Link from 'next/link';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  /** Omitted on the last item — the current page is text, not a link. */
  href?: string;
  label: string;
}

/**
 * Desktop-only breadcrumb trail. Small screens navigate with the header's
 * back button instead; this component is hidden below 900px.
 */
export function Breadcrumbs({ label, items }: { label: string; items: BreadcrumbItem[] }) {
  return (
    <nav className={styles.breadcrumbs} aria-label={label}>
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className={styles.item}>
            {index > 0 ? (
              <span className={styles.separator} aria-hidden="true">
                ›
              </span>
            ) : null}
            {item.href ? (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.current} aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
