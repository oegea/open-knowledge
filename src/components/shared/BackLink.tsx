import Link from 'next/link';
import styles from './BackLink.module.css';

interface BackLinkProps {
  href: string;
  label: string;
}

/** "← Label" contextual back link, identical on all viewports. */
export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link href={href} className={styles.back}>
      ← {label}
    </Link>
  );
}
