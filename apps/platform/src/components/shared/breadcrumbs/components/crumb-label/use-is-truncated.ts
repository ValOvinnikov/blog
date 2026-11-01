import type { TMaybeNull } from '@blog/config';
import { type RefObject, useEffect, useState } from 'react';

export const useIsTruncated = (
  ref: RefObject<TMaybeNull<HTMLElement>>,
): boolean => {
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () =>
      setIsTruncated(element.scrollWidth > element.clientWidth);

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return isTruncated;
};
