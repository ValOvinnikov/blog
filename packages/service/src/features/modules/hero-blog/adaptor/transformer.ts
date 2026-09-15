import {
  CTA_ACTION_VARIANT,
  HERO_IMAGE_SOURCE,
  type ISanityImage,
  type TMaybeUndefined,
} from '@blog/config';
import {
  toCtaButton,
  type TCtaButton,
} from '@blog/service/shared/transformers/to-cta-button';
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
  const primaryAction = toHeroPrimaryAction(
    raw.primaryActionLabel,
    post,
    raw.primaryActionAppearance,
  );
  if (!primaryAction) return undefined;

  return {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: primaryAction.appearance,
    link: {
      label: primaryAction.label,
      href: primaryAction.href,
      target: primaryAction.target,
      platform: primaryAction.platform,
      ariaLabel: undefined,
    },
    hiddenLabelSuffix: primaryAction.hiddenLabelSuffix,
  };
}

function toSecondaryButtons(
  raw: TRawHeroBlogModule['ctaButtons'],
): THeroBlogButton[] {
  if (!raw || raw.length === 0) return [];

  return raw
    .map(toCtaButton)
    .filter((button): button is TCtaButton => button !== undefined)
    .map((button) => ({ ...button, hiddenLabelSuffix: undefined }));
}

// Only one PRIMARY-role button exists in this list, and it is always the
// derived one placed first — Studio constrains authored `ctaButtons` here to
// SECONDARY only.
function toCtaButtons(
  raw: TRawHeroBlogModule,
  post: TPostCard | undefined,
): THeroBlogButton[] {
  const primary = toPrimaryButton(raw, post);
  const secondary = toSecondaryButtons(raw.ctaButtons);
  return primary ? [primary, ...secondary] : secondary;
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
