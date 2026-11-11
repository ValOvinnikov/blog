import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { isOneOf } from '@blog/utils/primitives';
import { DEVICE_FRAME_VIEWPORT_ATTRIBUTE } from '@platform/constants/device-frame';
import {
  SAMPLE_PART,
  SAMPLE_PART_ATTRIBUTE,
  SAMPLE_PART_ITEMS_ATTRIBUTE,
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

const SHAPE_SEARCH_DEPTH = 3;

const hasRoundedCorner = (element: Element) => {
  const { borderTopLeftRadius, borderBottomRightRadius } =
    getComputedStyle(element);
  return (
    parseFloat(borderTopLeftRadius) > 0 ||
    parseFloat(borderBottomRightRadius) > 0
  );
};

// A `SamplePart` wrapper has no corners of its own; the shape it outlines sits a few levels inside.
const shapeRadius = (element: Element) => {
  let shaped: TMaybeNull<Element> = element;
  for (let depth = 0; shaped && depth <= SHAPE_SEARCH_DEPTH; depth += 1) {
    if (hasRoundedCorner(shaped)) return getComputedStyle(shaped).borderRadius;
    shaped = shaped.firstElementChild;
  }
  return '0';
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

// A list marked as a whole wraps its own list element, whose children are the items.
const toPartSelector = (part: TSamplePart) =>
  `[${SAMPLE_PART_ATTRIBUTE}="${part}"], [${SAMPLE_PART_ITEMS_ATTRIBUTE}="${part}"] > * > *`;

const toMeasuredKey = (selector: string, scale: number) =>
  `${selector}|${scale}`;

export const usePartBoxes = (
  markRef: RefObject<TMaybeNull<HTMLElement>>,
  parts: readonly TSamplePart[],
  scale: number,
) => {
  const [measured, setMeasured] = useState<TMaybeUndefined<TMeasuredBoxes>>();
  const selector = parts.map(toPartSelector).join(',');
  const measuredFor = toMeasuredKey(selector, scale);

  useEffect(() => {
    const mark = markRef.current;
    const content = mark?.parentElement;
    if (!mark || !content) return;
    const elements = [...content.querySelectorAll(selector)];
    const measure = () =>
      setMeasured({
        measuredFor: toMeasuredKey(selector, scale),
        boxes: elements.flatMap(
          (element, index) => toPartBox(content, element, index, scale) ?? [],
        ),
      });

    const resize = new ResizeObserver(measure);
    resize.observe(content);
    elements.forEach((element) => resize.observe(element));

    const restyle = new MutationObserver((records) => {
      if (records.some(({ target }) => !mark.contains(target))) measure();
    });
    restyle.observe(content, { subtree: true, attributeFilter: ['style'] });

    return () => {
      resize.disconnect();
      restyle.disconnect();
    };
  }, [markRef, selector, scale]);

  return measured?.measuredFor === measuredFor ? measured.boxes : [];
};
