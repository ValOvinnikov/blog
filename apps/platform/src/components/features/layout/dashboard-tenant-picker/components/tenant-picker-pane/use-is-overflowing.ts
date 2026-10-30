import type { TMaybeNull } from '@blog/config';
import { type RefObject, useEffect, useState } from 'react';

const isScrollable = (element: HTMLElement) =>
  element.scrollHeight > element.clientHeight ||
  document.documentElement.scrollHeight > window.innerHeight;

export const useIsOverflowing = (
  ref: RefObject<TMaybeNull<HTMLElement>>,
  contentKey: number,
): boolean => {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const measure = () => {
      if (ref.current) setIsOverflowing(isScrollable(ref.current));
    };

    measure();
    window.addEventListener('resize', measure);

    return () => window.removeEventListener('resize', measure);
  }, [ref, contentKey]);

  return isOverflowing;
};
