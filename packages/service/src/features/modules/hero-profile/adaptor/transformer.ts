import {
  HERO_VARIANT,
  type ISanityImage,
  type TMaybeUndefined,
} from '@blog/config';
import { toCtaButtons } from '@blog/service/shared/transformers/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import { toHeroPresentation } from '@blog/service/shared/transformers/to-hero-presentation';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toPortableTextBlockWithResolvedLinks } from '@blog/service/shared/transformers/to-portable-text-mark-def';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { TSocialProfile } from '@blog/service/shared/transformers/to-social-profile';
import { toSocialProfiles } from '@blog/service/shared/transformers/to-social-profiles';
import type { InferResultType } from 'groqd';

import type { heroProfileModuleQuery } from './query';
import type { THeroProfileModule } from './types';

export type TRawHeroProfileModule = InferResultType<
  typeof heroProfileModuleQuery
>;

function toImage(raw: TRawHeroProfileModule): TMaybeUndefined<ISanityImage> {
  if (raw.variant === HERO_VARIANT.BANNER) return toSanityImage(raw.image);

  return toSanityImage(raw.image) ?? toSanityImage(raw.author.image);
}

function toSocialLinks(raw: TRawHeroProfileModule): TSocialProfile[] {
  if (!raw.showSocialLinks) return [];

  return toSocialProfiles(raw.author.socialLinks);
}

function toEyebrow(raw: TRawHeroProfileModule): TMaybeUndefined<string> {
  if (raw.showRole) return raw.author.role ?? undefined;

  return raw.eyebrow ?? undefined;
}

function toBio(raw: TRawHeroProfileModule): THeroProfileModule['bio'] {
  if (!raw.showBio) return undefined;

  return raw.author.bio?.map(toPortableTextBlockWithResolvedLinks) ?? undefined;
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
    eyebrow: toEyebrow(raw),
    avatarName: raw.author.name,
    sanityImage: toImage(raw),
    bio: toBio(raw),
    socialLinks: toSocialLinks(raw),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentPosition,
    contentAlignment: raw.contentAlignment ?? undefined,
    mediaOrder,
    layout: toLayout(raw.layout),
  };
}
