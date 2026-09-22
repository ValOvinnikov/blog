import {
  HERO_VARIANT,
  type TContentAlignment,
  type THeroVariant,
  type TMaybeUndefined,
  type TMediaOrder,
} from '@blog/config';

export type TRawHeroPresentationFields = {
  variant: THeroVariant;
  contentPositionSplit: TContentAlignment | null;
  contentPositionBanner: TContentAlignment | null;
  mediaOrderSplit: TMediaOrder | null;
  mediaOrderStacked: TMediaOrder | null;
};

export type THeroPresentation = {
  contentPosition: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
};

function toContentPosition(
  raw: TRawHeroPresentationFields,
): TMaybeUndefined<TContentAlignment> {
  switch (raw.variant) {
    case HERO_VARIANT.SPLIT:
      return raw.contentPositionSplit ?? undefined;
    case HERO_VARIANT.BANNER:
      return raw.contentPositionBanner ?? undefined;
    case HERO_VARIANT.STACKED:
      return undefined;
  }
}

function toMediaOrder(
  raw: TRawHeroPresentationFields,
): TMaybeUndefined<TMediaOrder> {
  switch (raw.variant) {
    case HERO_VARIANT.SPLIT:
      return raw.mediaOrderSplit ?? undefined;
    case HERO_VARIANT.STACKED:
      return raw.mediaOrderStacked ?? undefined;
    case HERO_VARIANT.BANNER:
      return undefined;
  }
}

/** Collapses a hero-family module's split/banner/stacked position and media-order field pairs into the single prop each variant actually renders. */
export function toHeroPresentation(
  raw: TRawHeroPresentationFields,
): THeroPresentation {
  return {
    contentPosition: toContentPosition(raw),
    mediaOrder: toMediaOrder(raw),
  };
}
