import { ReactNode, ViewTransition } from 'react';

/**
 * Page-level view transition: the outgoing page fades away and the incoming
 * one settles in (see the `page-in` / `page-out` rules in globals.css).
 * Wrap each page's <main>, never the layout — layouts persist across
 * navigations, so enter/exit would not fire there. `default="none"` keeps
 * ordinary state updates inside the page from re-running it.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}

/**
 * Shared element: two elements rendered with the same `name` on consecutive
 * pages morph into each other (a course thumbnail growing into its hero).
 * Names must be unique within a page.
 */
export function SharedElement({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}

export const courseCoverTransition = (courseId: string) => `course-cover-${courseId}`;
export const newsImageTransition = (postId: string) => `news-image-${postId}`;
