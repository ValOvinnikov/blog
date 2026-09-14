import {
  HERO_IMAGE_SOURCE,
  type ISanityImage,
  type TMaybeUndefined,
} from '@blog/config';
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
import type { THeroBlogModule, THeroBlogModuleBase } from './types';

export type TRawHeroBlogModule = InferResultType<typeof heroBlogModuleQuery>;

function toImage(
  raw: TRawHeroBlogModule,
  post: TPostCard | undefined,
): TMaybeUndefined<ISanityImage> {
  switch (raw.imageSource) {
    case HERO_IMAGE_SOURCE.CUSTOM:
      return toSanityImage(raw.image);
    case HERO_IMAGE_SOURCE.NONE:
      return undefined;
    case HERO_IMAGE_SOURCE.POST:
      return post?.heroImage;
  }
}

export function toHeroBlogModule(raw: TRawHeroBlogModule): THeroBlogModule {
  const post = raw.post ? toPostCard(raw.post) : undefined;
  const { contentPosition, mediaOrder } = toHeroPresentation(raw);

  const base: THeroBlogModuleBase = {
    brandVariant: raw.brandVariant,
    variant: raw.variant,
    eyebrow: raw.eyebrow ?? post?.topic?.title,
    supportingText: post?.excerpt,
    sanityImage: toImage(raw, post),
    primaryAction: toHeroPrimaryAction(
      raw.primaryActionLabel,
      post,
      raw.primaryActionAppearance,
    ),
    secondaryAction: raw.actions?.[0] ? toCtaAction(raw.actions[0]) : undefined,
    contentPosition,
    contentAlignment: raw.contentAlignment ?? undefined,
    mediaOrder,
    layout: toLayout(raw.layout),
  };

  return post
    ? { ...base, hasPost: true, heading: post.title }
    : { ...base, hasPost: false };
}
