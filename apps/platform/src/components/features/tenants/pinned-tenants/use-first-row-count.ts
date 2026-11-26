import type { TMaybeUndefined } from '@shinefold/config';
import { useEffect, useRef, useState } from 'react';

export const useFirstRowCount = (tileCount: number) => {
  const listRef = useRef<HTMLUListElement>(null);
  const [firstRowCount, setFirstRowCount] = useState<TMaybeUndefined<number>>();

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const tops = Array.from(list.children, (tile) =>
        Math.round(tile.getBoundingClientRect().top),
      );
      setFirstRowCount(tops.filter((top) => top === tops[0]).length);
    });
    observer.observe(list);

    return () => observer.disconnect();
  }, [tileCount]);

  return { listRef, firstRowCount };
};
