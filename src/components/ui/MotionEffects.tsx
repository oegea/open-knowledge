'use client';

import { useEffect } from 'react';

/** How long the reveal transition runs (keep in sync with --ok-duration-reveal). */
const REVEAL_MS = 700;
/** Delay between siblings entering the viewport together. */
const STAGGER_MS = 70;
const MAX_STAGGER_STEPS = 6;

/**
 * App-wide motion, mounted once in the root layout. Renders nothing.
 *
 * - `data-reveal`: the element fades and rises in when it scrolls into view.
 *   Only elements that are BELOW the viewport when first seen are hidden, so
 *   nothing server-rendered on screen ever flashes, and without JavaScript
 *   (or with reduced motion) every element simply stays visible.
 * - `data-spotlight`: on hover-capable pointers the element exposes the
 *   cursor position as `--ok-mx` / `--ok-my` for the glow in globals.css.
 *
 * State lives in `data-reveal-state` (not in class names) so React
 * re-rendering an element's className never drops it mid-transition.
 */
export function MotionEffects() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cleanups: Array<() => void> = [];

    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
      const seen = new WeakSet<Element>();
      const timers = new Set<number>();

      const observer = new IntersectionObserver(
        (entries) => {
          const entering = entries.filter((entry) => entry.isIntersecting);
          entering.forEach((entry, index) => {
            const element = entry.target as HTMLElement;
            observer.unobserve(element);
            const delay = Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS;
            element.style.setProperty('--ok-reveal-delay', `${delay}ms`);
            element.dataset.revealState = 'run';
            const timer = window.setTimeout(() => {
              timers.delete(timer);
              // Hand the element back untouched: its own hover transitions
              // must not inherit the reveal's duration or delay.
              element.dataset.revealState = 'done';
              element.style.removeProperty('--ok-reveal-delay');
            }, delay + REVEAL_MS + 50);
            timers.add(timer);
          });
        },
        { rootMargin: '0px 0px -6% 0px' }
      );

      const scan = () => {
        document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          const rect = element.getBoundingClientRect();
          // Hidden (display: none) elements measure 0×0: leave them alone.
          if (rect.width === 0 && rect.height === 0) return;
          if (rect.top < window.innerHeight) return;
          element.dataset.revealState = 'pending';
          observer.observe(element);
        });
      };

      let frame = 0;
      const scheduleScan = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          scan();
        });
      };

      scan();
      // Client-side navigations and data loads add new revealable content.
      const mutations = new MutationObserver(scheduleScan);
      mutations.observe(document.body, { childList: true, subtree: true });

      cleanups.push(() => {
        mutations.disconnect();
        observer.disconnect();
        if (frame) window.cancelAnimationFrame(frame);
        timers.forEach((timer) => window.clearTimeout(timer));
        document
          .querySelectorAll<HTMLElement>('[data-reveal-state]')
          .forEach((element) => delete element.dataset.revealState);
      });
    }

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const onPointerMove = (event: PointerEvent) => {
        const target = event.target instanceof Element ? event.target : null;
        const element = target?.closest<HTMLElement>('[data-spotlight]');
        if (!element) return;
        const rect = element.getBoundingClientRect();
        element.style.setProperty('--ok-mx', `${event.clientX - rect.left}px`);
        element.style.setProperty('--ok-my', `${event.clientY - rect.top}px`);
      };
      document.addEventListener('pointermove', onPointerMove, { passive: true });
      cleanups.push(() => document.removeEventListener('pointermove', onPointerMove));
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
