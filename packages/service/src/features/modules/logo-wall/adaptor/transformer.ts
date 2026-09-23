import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import { toLinkDocument } from '@blog/service/shared/transformers/link/to-link-document';
import type { InferResultType } from 'groqd';

import type { logoWallModuleQuery } from './query';
import type { TLogoItem, TLogoWallModule } from './types';

export type TRawLogoWallModule = InferResultType<typeof logoWallModuleQuery>;

type TRawLogoItem = NonNullable<TRawLogoWallModule['logos']>[number];

class UnresolvedLogoImageError extends Error {
  readonly code = 'UNRESOLVED_LOGO_IMAGE' as const;

  constructor(name: string) {
    super(
      `Logo "${name}"'s image was accepted by the query but failed to resolve to an asset.`,
    );
  }
}

function toLogoItem(raw: TRawLogoItem): TLogoItem {
  const image = toSanityImage({ ...raw.image, alt: raw.name });

  if (!image) {
    throw new UnresolvedLogoImageError(raw.name);
  }

  return {
    id: raw._key,
    name: raw.name,
    image,
    link: toLinkDocument(raw.link),
  };
}

export function toLogoWallModule(raw: TRawLogoWallModule): TLogoWallModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    logos: raw.logos.map(toLogoItem),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    displayMode: raw.displayMode,
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
