import type { TMaybeUndefined } from '@blog/config';
import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import type { TLookGroup } from '@platform/constants/look-group';
import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import { LOOK_CARDS } from '@platform/utils/look-open-rows/look-open-rows';

export type TLookAnchor = TLookCard | TLookGroup;

export const LOOK_ANCHOR_CLASSES = 'scroll-mt-admin-form-gap';

export const toLookAnchorId = (anchor: TLookAnchor) =>
  `look-${anchor.toLowerCase()}`;

export const findLookCardContaining = (
  target: Node,
): TMaybeUndefined<TLookCard> =>
  LOOK_CARDS.find((card) =>
    document.getElementById(toLookAnchorId(card))?.contains(target),
  );

export const findTopmostLookCard = (belowY: number): TLookCard =>
  LOOK_CARDS.find(
    (card) =>
      (document.getElementById(toLookAnchorId(card))?.getBoundingClientRect()
        .bottom ?? -Infinity) >= belowY,
  ) ?? LOOK_CARD.LANGUAGE_SWITCHER;

export const scrollToLookAnchor = (anchor: TLookAnchor) => {
  const element = document.getElementById(toLookAnchorId(anchor));
  if (!element) return;
  const start = performance.now();
  const pin = () => {
    element.scrollIntoView({ block: 'start' });
    if (performance.now() - start < LOOK_LAYOUT_LIMIT.ANCHOR_SETTLE_MS) {
      requestAnimationFrame(pin);
    }
  };
  requestAnimationFrame(pin);
};
