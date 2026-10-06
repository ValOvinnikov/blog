import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { childPagesQuery } from './pages.query';
import type { childPagesModuleQuery } from './query';
import type { TChildPageCard, TChildPagesModule } from './types';

export type TRawChildPagesModule = InferResultType<
  typeof childPagesModuleQuery
>;
export type TRawChildPages = InferResultType<typeof childPagesQuery>;

function toChildPageCard(raw: TRawChildPages[number]): TChildPageCard {
  const { heading: title, supportingText: summary } = toHeadingBlock(
    raw.headingBlock,
  );

  return {
    id: raw._id,
    title,
    summary,
    image: toSanityImage(raw.image),
    path: raw.path,
  };
}

export function toChildPagesModule(
  raw: TRawChildPagesModule,
  pages: TRawChildPages,
): TChildPagesModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: raw.headingBlock
      ? toHeadingBlock(raw.headingBlock)
      : undefined,
    pages: pages.map(toChildPageCard),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
  };
}
