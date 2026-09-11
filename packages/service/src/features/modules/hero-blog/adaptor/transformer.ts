import {
  HERO_IMAGE_SOURCE,
  type ISanityImage,
  type TMaybeUndefined,
} from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import { toCtaAction } from '@blog/service/shared/transformers/to-cta-action';
import { toHeroPresentation } from '@blog/service/shared/transformers/to-hero-presentation';
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
  const { contentPosition, mediaOrder } = toHeroPresentation(raw);

  return {
    brandVariant: raw.brandVariant,
    variant: raw.variant,
    eyebrow: raw.eyebrow ?? post?.topic?.title,
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
    contentPosition,
    contentAlignment: raw.contentAlignment ?? undefined,
    mediaOrder,
    layout: toLayout(raw.layout),
  };
}
