import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { SAMPLE_PART_ATTRIBUTE } from '@platform/constants/sample-part';
import { useEffect, useState, type RefObject } from 'react';

type TPartBox = { top: number; left: number; width: number; height: number };

export const usePartBox = (
  markRef: RefObject<TMaybeNull<HTMLElement>>,
  part: string,
  scale: number,
) => {
  const [box, setBox] = useState<TMaybeUndefined<TPartBox>>();

  useEffect(() => {
    const content = markRef.current?.parentElement;
    const element = content?.querySelector(
      `[${SAMPLE_PART_ATTRIBUTE}="${part}"]`,
    );
    if (!content || !element) return;

    const observer = new ResizeObserver(() => {
      const contentRect = content.getBoundingClientRect();
      const { top, left, width, height } = element.getBoundingClientRect();
      setBox({
        top: (top - contentRect.top) / scale,
        left: (left - contentRect.left) / scale,
        width: width / scale,
        height: height / scale,
      });
    });
    observer.observe(content);
    observer.observe(element);

    return () => observer.disconnect();
  }, [markRef, part, scale]);

  return box;
};
