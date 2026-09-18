import {
  PROFILE_IMAGE_SOURCE,
  type ISanityImage,
  type TMaybeUndefined,
} from '@blog/config';
import {
  toCtaButton,
  type TCtaButton,
} from '@blog/service/shared/transformers/to-cta-button';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import { toHeroPresentation } from '@blog/service/shared/transformers/to-hero-presentation';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import {
  toSocialProfile,
  type TSocialProfile,
} from '@blog/service/shared/transformers/to-social-profile';
import type { InferResultType } from 'groqd';

import type { heroProfileModuleQuery } from './query';
import type { THeroProfileModule } from './types';

export type TRawHeroProfileModule = InferResultType<
  typeof heroProfileModuleQuery
>;

function toCtaButtons(raw: TRawHeroProfileModule['ctaButtons']): TCtaButton[] {
  if (!raw || raw.length === 0) return [];

  return raw
    .map(toCtaButton)
    .filter((button): button is TCtaButton => button !== undefined);
}

function toImage(raw: TRawHeroProfileModule): TMaybeUndefined<ISanityImage> {
  switch (raw.imageSource) {
    case PROFILE_IMAGE_SOURCE.CUSTOM:
      return toSanityImage(raw.image);
    case PROFILE_IMAGE_SOURCE.AUTHOR:
      return toSanityImage(raw.author.image);
    case PROFILE_IMAGE_SOURCE.NONE:
      return undefined;
  }
}

function toSocialLinks(raw: TRawHeroProfileModule): TSocialProfile[] {
  if (!raw.showSocialLinks) return [];

  return (raw.author.socialLinks ?? []).flatMap(
    (item) => toSocialProfile(item) ?? [],
  );
}

export function toHeroProfileModule(
  raw: TRawHeroProfileModule,
): THeroProfileModule {
  // module_heroProfile has no mediaOrderStacked field — Stacked never authors
  // a custom order, so toHeroPresentation always resolves it to undefined.
  const { contentPosition, mediaOrder } = toHeroPresentation({
    ...raw,
    mediaOrderStacked: null,
  });

  return {
    brandVariant: raw.brandVariant,
    variant: raw.variant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    eyebrow: raw.eyebrow ?? undefined,
    sanityImage: toImage(raw),
    socialLinks: toSocialLinks(raw),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentPosition,
    contentAlignment: raw.contentAlignment ?? undefined,
    mediaOrder,
    layout: toLayout(raw.layout),
  };
}
