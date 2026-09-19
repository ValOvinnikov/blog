'use client';

import { useEffect, useState } from 'react';

/**
 * `ids` need not be deduped or memoized by the caller — a fresh array
 * reference each render is safe.
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
