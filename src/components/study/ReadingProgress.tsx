'use client';

import { useEffect, useState } from 'react';
import styles from './ReadingProgress.module.css';

/**
 * Thin reading-position bar pinned to the top of the viewport while
 * consuming a material — the "how far into this page am I" signal every
 * good reader app has.
 */
export function ReadingProgress() {
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setRatio(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div className={styles.fill} style={{ transform: `scaleX(${ratio})` }} />
    </div>
  );
}
