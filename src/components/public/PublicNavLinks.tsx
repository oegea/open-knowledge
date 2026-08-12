'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './PublicHeader.module.css';

export interface NavLinkItem {
  href: string;
  label: string;
}

/** '/' matches only exactly; other hrefs match themselves and their subtree. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicNavLinks({ label, links }: { label: string; links: NavLinkItem[] }) {
  const pathname = usePathname();

  return (
    <nav className={styles.desktopNav} aria-label={label}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={styles.navLink}
          aria-current={isActivePath(pathname, link.href) ? 'page' : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
