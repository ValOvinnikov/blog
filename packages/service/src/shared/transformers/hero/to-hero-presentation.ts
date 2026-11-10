import {
  HERO_VARIANT,
  type TContentAlignment,
  type THeroVariant,
  type TMaybeNull,
  type TMaybeUndefined,
  type TMediaOrder,
} from '@blog/config';

export type TRawHeroPresentationFields = {
  variant: THeroVariant;
  contentPositionSplit: TMaybeNull<TContentAlignment>;
  contentPositionBanner: TMaybeNull<TContentAlignment>;
  mediaOrderSplit: TMaybeNull<TMediaOrder>;
  mediaOrderStacked: TMaybeNull<TMediaOrder>;
  contentAlignment: TMaybeNull<TContentAlignment>;
};

export type THeroPresentation = {
  variant: THeroVariant;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
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

/** Collapses the per-variant position and media-order field pairs into the one value the authored variant renders. */
export function toHeroPresentation(
  raw: TRawHeroPresentationFields,
): THeroPresentation {
  return {
    variant: raw.variant,
    contentPosition: toContentPosition(raw),
    contentAlignment: raw.contentAlignment ?? undefined,
    mediaOrder: toMediaOrder(raw),
  };
}
