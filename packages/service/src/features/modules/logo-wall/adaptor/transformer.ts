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

function toLogoItem(raw: TRawLogoItem): TLogoItem {
  return {
    id: raw._id,
    name: raw.name,
    image: toSanityImage(raw.image),
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
