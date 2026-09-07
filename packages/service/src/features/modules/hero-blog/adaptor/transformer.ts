import {
  HERO_IMAGE_SOURCE,
  HERO_VARIANT,
  type ISanityImage,
  type TContentAlignment,
  type TMaybeUndefined,
  type TMediaOrder,
} from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import { toCtaAction } from '@blog/service/shared/transformers/to-cta-action';
import { toHeroPrimaryAction } from '@blog/service/shared/transformers/to-hero-primary-action';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import {
  toPostCard,
  type TPostCard,
} from '@blog/service/shared/transformers/to-post-card';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { heroBlogModuleQuery } from './query';
import type { THeroBlogModule } from './types';

export type TRawHeroBlogModule = InferResultType<typeof heroBlogModuleQuery>;

function toContentPosition(
  raw: TRawHeroBlogModule,
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

function toMediaOrder(raw: TRawHeroBlogModule): TMaybeUndefined<TMediaOrder> {
  switch (raw.variant) {
    case HERO_VARIANT.SPLIT:
      return raw.mediaOrderSplit ?? undefined;
    case HERO_VARIANT.STACKED:
      return raw.mediaOrderStacked ?? undefined;
    case HERO_VARIANT.BANNER:
      return undefined;
  }
}

function toImage(
  raw: TRawHeroBlogModule,
  post: TPostCard | undefined,
  tenant: TImageTenant,
): TMaybeUndefined<ISanityImage> {
  switch (raw.imageSource) {
    case HERO_IMAGE_SOURCE.CUSTOM:
      return toSanityImage(raw.image, tenant);
    case HERO_IMAGE_SOURCE.NONE:
      return undefined;
    case HERO_IMAGE_SOURCE.POST:
      return post?.heroImageSanity;
  }
}

export function toHeroBlogModule(
  raw: TRawHeroBlogModule,
  tenant: TImageTenant,
): THeroBlogModule {
  const post = raw.post ? toPostCard(raw.post, tenant) : undefined;

  return {
    brandVariant: raw.brandVariant,
    variant: raw.variant,
    eyebrow: raw.eyebrow ?? post?.topic.title,
    heading: raw.heading ?? post?.title,
    supportingText: raw.supportingText ?? post?.excerpt,
    sanityImage: toImage(raw, post, tenant),
    primaryAction: toHeroPrimaryAction(
      raw.primaryActionLabel,
      post,
      raw.primaryActionAppearance,
    ),
    secondaryAction: raw.secondaryAction
      ? toCtaAction(raw.secondaryAction)
      : undefined,
    contentPosition: toContentPosition(raw),
    contentAlignment: raw.contentAlignment ?? undefined,
    mediaOrder: toMediaOrder(raw),
    layout: toLayout(raw.layout),
  };
}
