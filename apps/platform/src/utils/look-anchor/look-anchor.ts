import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import { LOOK_CARDS } from '@platform/utils/look-open-rows/look-open-rows';
import type { TMaybeUndefined } from '@shinefold/config';

export const LOOK_ANCHOR_CLASSES = 'scroll-mt-platform-form-gap';

export const toLookAnchorId = (card: TLookCard) => `look-${card.toLowerCase()}`;

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
  ) ?? LOOK_CARD.DETAILS;

export const scrollToLookAnchor = (card: TLookCard) => {
  const element = document.getElementById(toLookAnchorId(card));
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
