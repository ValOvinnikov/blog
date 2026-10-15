import type { TMaybeNull } from '@blog/config';

import type { TBox, TProbeWindow, TRgba } from './contrast-probe';

export type TTextTarget = {
  path: string;
  snippet: string;
  boxes: TBox[];
  color: TRgba;
  isLarge: boolean;
};

export const INTERACTIVE_SELECTOR =
  'a[href], button, summary, label, [role="button"], [role="link"], [role="tab"], [role="switch"], [role="menuitem"]';

// Runs in the page via `page.evaluate`, so it must stay self-contained.
export const collectTextTargets = (
  interactiveSelector: TMaybeNull<string>,
): TTextTarget[] => {
  const probe = (window as unknown as TProbeWindow).contrastProbe;
  const textNodesByElement = new Map<Element, Text[]>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!node.textContent?.trim() || !element) continue;
    if (element.closest('svg, script, style, noscript, template')) continue;
    if (interactiveSelector && !element.closest(interactiveSelector)) continue;
    textNodesByElement.set(element, [
      ...(textNodesByElement.get(element) ?? []),
      node as Text,
    ]);
  }

  const targets: TTextTarget[] = [];
  textNodesByElement.forEach((textNodes, element) => {
    if (!probe.isMeasurable(element)) return;
    const style = getComputedStyle(element);
    const color = probe.resolveColor(
      style.color,
      probe.effectiveOpacity(element),
    );
    if (!color || color[3] === 0) return;
    const boxes = textNodes.flatMap((textNode) => {
      const range = document.createRange();
      range.selectNodeContents(textNode);
      return Array.from(range.getClientRects()).flatMap((rect) => {
        const box = probe.visibleBox(element, rect);
        return box ? [box] : [];
      });
    });
    if (boxes.length === 0) return;
    const fontSize = parseFloat(style.fontSize);
    const isBold = Number(style.fontWeight) >= 700;
    targets.push({
      path: probe.elementPath(element),
      snippet: probe.snippet(element),
      boxes,
      color,
      isLarge: fontSize >= 24 || (isBold && fontSize >= 18.66),
    });
  });
  return targets;
};
