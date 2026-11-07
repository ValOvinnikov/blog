import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { DEVICE_FRAME_VIEWPORT_ATTRIBUTE } from '@platform/constants/device-frame';
import {
  SAMPLE_PART,
  SAMPLE_PART_ATTRIBUTE,
  type TSamplePart,
} from '@platform/constants/sample-part';
import { useEffect, useState, type RefObject } from 'react';

type TPartBox = {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
};

const edgeCornersRadius = (
  content: Element,
  part: TSamplePart,
  scale: number,
) => {
  const viewport = content.closest(`[${DEVICE_FRAME_VIEWPORT_ATTRIBUTE}]`);
  const viewportRadius = viewport
    ? parseFloat(getComputedStyle(viewport).borderTopLeftRadius) || 0
    : 0;
  const radius = `${viewportRadius / scale}px`;

  return part === SAMPLE_PART.HEADER
    ? `${radius} ${radius} 0 0`
    : `0 0 ${radius} ${radius}`;
};

export const usePartBox = (
  markRef: RefObject<TMaybeNull<HTMLElement>>,
  part: TSamplePart,
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
        borderRadius: edgeCornersRadius(content, part, scale),
      });
    });
    observer.observe(content);
    observer.observe(element);

    return () => observer.disconnect();
  }, [markRef, part, scale]);

  return box;
};
