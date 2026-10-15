import type { TMaybeNull } from '@blog/config';

import type { TBox, TProbeWindow, TRgba } from './contrast-probe';

export type TEdgeTarget = {
  path: string;
  snippet: string;
  box: TBox;
  color: TRgba;
};

export type TEdgeKind = 'focus' | 'boundary';

export const FOCUSABLE_SELECTOR =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';

// Runs in the page via `page.evaluate`, so it must stay self-contained.
export const collectEdgeTargets = ({
  kind,
  focusableSelector,
}: {
  kind: TEdgeKind;
  focusableSelector: string;
}): TEdgeTarget[] => {
  const probe = (window as unknown as TProbeWindow).contrastProbe;
  const controlSelector =
    'input:not([type="hidden"]), select, textarea, [role="switch"], [role="checkbox"], [role="radio"], [role="slider"]';
  const sides = ['top', 'right', 'bottom', 'left'];

  const focusColor = (style: CSSStyleDeclaration): TMaybeNull<string> => {
    if (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) {
      return style.outlineColor;
    }
    const ringColor = style.getPropertyValue('--tw-ring-color').trim();
    return style.boxShadow !== 'none' && ringColor ? ringColor : null;
  };

  const boundaryColor = (style: CSSStyleDeclaration): TMaybeNull<string> => {
    const borderSide = sides.find(
      (side) =>
        style.getPropertyValue(`border-${side}-style`) !== 'none' &&
        parseFloat(style.getPropertyValue(`border-${side}-width`)) >= 1,
    );
    return borderSide
      ? style.getPropertyValue(`border-${borderSide}-color`)
      : style.backgroundColor;
  };

  const selector = kind === 'focus' ? focusableSelector : controlSelector;
  return Array.from(document.body.querySelectorAll(selector)).flatMap(
    (element) => {
      if (!probe.isMeasurable(element)) return [];
      const style = getComputedStyle(element);
      const value = kind === 'focus' ? focusColor(style) : boundaryColor(style);
      const color = value ? probe.resolveColor(value) : null;
      const box = probe.visibleBox(element, element.getBoundingClientRect());
      if (!color || color[3] === 0 || !box) return [];
      return [
        {
          path: probe.elementPath(element),
          snippet: probe.snippet(element),
          box,
          color,
        },
      ];
    },
  );
};
