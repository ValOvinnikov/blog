import { CONTENT_ALIGNMENT, HERO_VARIANT, MEDIA_ORDER } from '@blog/config';

import {
  toHeroPresentation,
  type TRawHeroPresentationFields,
} from './to-hero-presentation';

function makeRaw(
  overrides: Partial<TRawHeroPresentationFields> = {},
): TRawHeroPresentationFields {
  return {
    variant: HERO_VARIANT.SPLIT,
    contentPositionSplit: null,
    contentPositionBanner: null,
    mediaOrderSplit: null,
    mediaOrderStacked: null,
    ...overrides,
  };
}

describe(toHeroPresentation, () => {
  it('takes contentPosition from contentPositionSplit on Split, ignoring contentPositionBanner', () => {
    const raw = makeRaw({
      variant: HERO_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
    });

    expect(toHeroPresentation(raw).contentPosition).toBe(
      CONTENT_ALIGNMENT.RIGHT,
    );
  });

  it('takes contentPosition from contentPositionBanner on Banner, ignoring contentPositionSplit', () => {
    const raw = makeRaw({
      variant: HERO_VARIANT.BANNER,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    expect(toHeroPresentation(raw).contentPosition).toBe(
      CONTENT_ALIGNMENT.CENTER,
    );
  });

  it('leaves contentPosition undefined on Stacked regardless of stored position keys', () => {
    const raw = makeRaw({
      variant: HERO_VARIANT.STACKED,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    expect(toHeroPresentation(raw).contentPosition).toBeUndefined();
  });

  it('takes mediaOrder from mediaOrderSplit on Split, ignoring mediaOrderStacked', () => {
    const raw = makeRaw({
      variant: HERO_VARIANT.SPLIT,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    expect(toHeroPresentation(raw).mediaOrder).toBe(MEDIA_ORDER.FIRST);
  });

  it('takes mediaOrder from mediaOrderStacked on Stacked, ignoring mediaOrderSplit', () => {
    const raw = makeRaw({
      variant: HERO_VARIANT.STACKED,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    expect(toHeroPresentation(raw).mediaOrder).toBe(MEDIA_ORDER.LAST);
  });

  it('leaves mediaOrder undefined on Banner regardless of stored order keys', () => {
    const raw = makeRaw({
      variant: HERO_VARIANT.BANNER,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.FIRST,
    });

    expect(toHeroPresentation(raw).mediaOrder).toBeUndefined();
  });
});
