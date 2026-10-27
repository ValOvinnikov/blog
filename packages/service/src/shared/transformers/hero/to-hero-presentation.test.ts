import { CONTENT_ALIGNMENT, HERO_VARIANT, MEDIA_ORDER } from '@blog/config';

import {
  toHeroPresentation,
  type TRawHeroPresentationFields,
} from './to-hero-presentation';

function mockRawHeroPresentation(
  overrides: Partial<TRawHeroPresentationFields> = {},
): TRawHeroPresentationFields {
  return {
    variant: HERO_VARIANT.SPLIT,
    contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
    contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    mediaOrderSplit: MEDIA_ORDER.FIRST,
    mediaOrderStacked: MEDIA_ORDER.LAST,
    ...overrides,
  };
}

describe(toHeroPresentation, () => {
  it.each([
    [HERO_VARIANT.SPLIT, CONTENT_ALIGNMENT.RIGHT],
    [HERO_VARIANT.BANNER, CONTENT_ALIGNMENT.CENTER],
    [HERO_VARIANT.STACKED, undefined],
  ])('resolves the %s content position to %s', (variant, expected) => {
    const { contentPosition } = toHeroPresentation(
      mockRawHeroPresentation({ variant }),
    );

    expect(contentPosition).toBe(expected);
  });

  it.each([
    [HERO_VARIANT.SPLIT, MEDIA_ORDER.FIRST],
    [HERO_VARIANT.STACKED, MEDIA_ORDER.LAST],
    [HERO_VARIANT.BANNER, undefined],
  ])('resolves the %s media order to %s', (variant, expected) => {
    const { mediaOrder } = toHeroPresentation(
      mockRawHeroPresentation({ variant }),
    );

    expect(mediaOrder).toBe(expected);
  });
});
