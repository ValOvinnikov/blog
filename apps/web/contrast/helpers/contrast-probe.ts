import type { TMaybeNull } from '@blog/config';

export type TRgba = [number, number, number, number];

export type TBox = { x: number; y: number; width: number; height: number };

type TContrastProbe = {
  resolveColor: (value: string, opacity?: number) => TMaybeNull<TRgba>;
  elementPath: (element: Element) => string;
  snippet: (element: Element) => string;
  visibleBox: (element: Element, rect: DOMRect) => TMaybeNull<TBox>;
  isMeasurable: (element: Element) => boolean;
  effectiveOpacity: (element: Element) => number;
};

export type TProbeWindow = Window & { contrastProbe: TContrastProbe };

// Runs in the page via `addInitScript`, so it must stay self-contained.
export const installContrastProbe = () => {
  let context: TMaybeNull<CanvasRenderingContext2D> = null;

  const resolveColor = (value: string, opacity = 1): TMaybeNull<TRgba> => {
    if (!context) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      context = canvas.getContext('2d', { willReadFrequently: true });
    }
    if (!context) return null;
    context.fillStyle = '#000000';
    context.fillStyle = value;
    const onBlack = context.fillStyle;
    context.fillStyle = '#ffffff';
    context.fillStyle = value;
    if (context.fillStyle !== onBlack) return null;
    context.clearRect(0, 0, 1, 1);
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0, alpha = 0] = context.getImageData(
      0,
      0,
      1,
      1,
    ).data;
    return [red, green, blue, (alpha / 255) * opacity];
  };

  const elementPath = (element: Element): string => {
    const segments: string[] = [];
    let current: TMaybeNull<Element> = element;
    while (
      current &&
      current !== document.body &&
      current.id !== 'storybook-root'
    ) {
      const tag = current.tagName.toLowerCase();
      const sameTagSiblings = Array.from(
        current.parentElement?.children ?? [],
      ).filter((sibling) => sibling.tagName === current?.tagName);
      segments.unshift(
        sameTagSiblings.length > 1
          ? `${tag}:nth-of-type(${sameTagSiblings.indexOf(current) + 1})`
          : tag,
      );
      current = current.parentElement;
    }
    return segments.join(' > ');
  };

  const snippet = (element: Element): string =>
    (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);

  const visibleBox = (element: Element, rect: DOMRect): TMaybeNull<TBox> => {
    let left = Math.max(rect.left, 0);
    let top = rect.top;
    let right = Math.min(rect.right, document.documentElement.clientWidth);
    let bottom = rect.bottom;
    for (
      let ancestor = element.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const { overflowX, overflowY } = getComputedStyle(ancestor);
      if (overflowX === 'visible' && overflowY === 'visible') continue;
      const clip = ancestor.getBoundingClientRect();
      left = Math.max(left, clip.left);
      top = Math.max(top, clip.top);
      right = Math.min(right, clip.right);
      bottom = Math.min(bottom, clip.bottom);
    }
    if (right - left < 2 || bottom - top < 2) return null;
    return {
      x: Math.round(left + window.scrollX),
      y: Math.round(top + window.scrollY),
      width: Math.floor(right - left),
      height: Math.floor(bottom - top),
    };
  };

  const isMeasurable = (element: Element): boolean =>
    element.checkVisibility({
      opacityProperty: true,
      visibilityProperty: true,
    }) && !element.closest('[disabled], [aria-disabled="true"], [inert]');

  const effectiveOpacity = (element: Element): number => {
    let opacity = 1;
    for (
      let current: TMaybeNull<Element> = element;
      current;
      current = current.parentElement
    ) {
      opacity *= Number(getComputedStyle(current).opacity);
    }
    return opacity;
  };

  (window as unknown as TProbeWindow).contrastProbe = {
    resolveColor,
    elementPath,
    snippet,
    visibleBox,
    isMeasurable,
    effectiveOpacity,
  };
};
