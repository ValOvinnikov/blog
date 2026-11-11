import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { isOneOf } from '@blog/utils/primitives';
import { DEVICE_FRAME_VIEWPORT_ATTRIBUTE } from '@platform/constants/device-frame';
import {
  SAMPLE_PART,
  SAMPLE_PART_ATTRIBUTE,
  type TSamplePart,
} from '@platform/constants/sample-part';
import { useEffect, useState, type RefObject } from 'react';

type TPartBox = {
  key: string;
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
  isInset: boolean;
};

type TMeasuredBoxes = {
  measuredFor: string;
  boxes: readonly TPartBox[];
};

const EDGE_PARTS = [SAMPLE_PART.HEADER, SAMPLE_PART.FOOTER] as const;

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

const hasRoundedCorner = (element: Element) =>
  parseFloat(getComputedStyle(element).borderTopLeftRadius) > 0 ||
  parseFloat(getComputedStyle(element).borderBottomRightRadius) > 0;

// A `SamplePart` wrapper has no corners of its own; the shape it outlines is its child's.
const shapeRadius = (element: Element) => {
  const shaped =
    hasRoundedCorner(element) || !element.firstElementChild
      ? element
      : element.firstElementChild;
  return getComputedStyle(shaped).borderRadius || '0';
};

const toPartBox = (
  content: Element,
  element: Element,
  index: number,
  scale: number,
): TMaybeUndefined<TPartBox> => {
  const { top, left, width, height } = element.getBoundingClientRect();
  if (!width || !height) return undefined;
  const contentRect = content.getBoundingClientRect();
  const part = element.getAttribute(SAMPLE_PART_ATTRIBUTE);
  const isInset = isOneOf(EDGE_PARTS, part);

  return {
    key: `${part}:${index}`,
    top: (top - contentRect.top) / scale,
    left: (left - contentRect.left) / scale,
    width: width / scale,
    height: height / scale,
    borderRadius: isInset
      ? edgeCornersRadius(content, part, scale)
      : shapeRadius(element),
    isInset,
  };
};

export const usePartBoxes = (
  markRef: RefObject<TMaybeNull<HTMLElement>>,
  parts: readonly TSamplePart[],
  scale: number,
) => {
  const [measured, setMeasured] = useState<TMaybeUndefined<TMeasuredBoxes>>();
  const selector = parts
    .map((part) => `[${SAMPLE_PART_ATTRIBUTE}="${part}"]`)
    .join(',');
  const measuredFor = `${selector}|${scale}`;

  useEffect(() => {
    const content = markRef.current?.parentElement;
    if (!content) return;
    const elements = [...content.querySelectorAll(selector)];

    const observer = new ResizeObserver(() => {
      setMeasured({
        measuredFor,
        boxes: elements.flatMap(
          (element, index) => toPartBox(content, element, index, scale) ?? [],
        ),
      });
    });
    observer.observe(content);
    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [markRef, selector, scale, measuredFor]);

  return measured?.measuredFor === measuredFor ? measured.boxes : [];
};
