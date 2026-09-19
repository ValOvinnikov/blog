import {
  CTA_ACTION_VARIANT,
  HERO_IMAGE_SOURCE,
  routes,
  type ISanityImage,
  type TMaybeUndefined,
} from '@blog/config';
import { toCtaButton } from '@blog/service/shared/transformers/to-cta-button';
import { toHeroPresentation } from '@blog/service/shared/transformers/to-hero-presentation';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import {
  toPostCard,
  type TPostCard,
} from '@blog/service/shared/transformers/to-post-card';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { heroBlogModuleQuery } from './query';
import type {
  THeroBlogButton,
  THeroBlogModule,
  THeroBlogModuleBase,
} from './types';

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

function toPrimaryButton(
  raw: TRawHeroBlogModule,
  post: TPostCard | undefined,
): THeroBlogButton | undefined {
  if (!post) return undefined;

  return {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: raw.primaryActionAppearance,
    link: {
      label: raw.primaryActionLabel,
      href: routes.post(post.slug),
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    },
  };
}

function toSecondaryButton(
  raw: TRawHeroBlogModule['secondaryAction'],
): THeroBlogButton | undefined {
  return raw ? toCtaButton(raw) : undefined;
}

function toCtaButtons(
  raw: TRawHeroBlogModule,
  post: TPostCard | undefined,
): THeroBlogButton[] {
  return [
    toPrimaryButton(raw, post),
    toSecondaryButton(raw.secondaryAction),
  ].filter((button): button is THeroBlogButton => button !== undefined);
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
    ctaButtons: toCtaButtons(raw, post),
    contentPosition,
    contentAlignment: raw.contentAlignment ?? undefined,
    mediaOrder,
    layout: toLayout(raw.layout),
  };

  return post
    ? { ...base, hasPost: true, heading: post.title }
    : { ...base, hasPost: false };
}
