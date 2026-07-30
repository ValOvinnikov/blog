'use client';

import { useEffect, useState } from 'react';

/**
 * useActiveHeadingId — tracks which of the given heading `id`s is currently
 * the "active" section, for `PostContentsRail`'s `aria-current="location"`
 * highlighting. Observes each `#id` element (already rendered by
 * `PortableTextRenderer`) with an `IntersectionObserver` whose `rootMargin`
 * shrinks the effective viewport to a thin band below the sticky header —
 * of the headings currently crossing that band, the topmost one becomes
 * active. Returns `null` until the user has scrolled past the first heading.
 *
 * `ids` is taken as a plain array (not deduped/memoized by the caller) — this
 * hook only re-derives its own stable key (`ids.join('|')`) for the effect's
 * dependency, so passing a fresh array reference each render is safe.
 */
export const useActiveHeadingId = (ids: string[]): string | null => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const idsKey = ids.join('|');

  useEffect(() => {
    if (!idsKey) return;

    const elements = idsKey
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [topMost] = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (topMost) {
          setActiveId(topMost.target.id);
        }
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [idsKey]);

  return activeId;
};
