import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { childPagesQuery } from './query';
import type { TChildPageCard } from './types';

export type TRawChildPages = InferResultType<typeof childPagesQuery>;

function toChildPageCard(
  raw: TRawChildPages[number],
  parentPath: string,
): TChildPageCard {
  const { heading: title, supportingText: summary } = toHeadingBlock(
    raw.headingBlock,
  );

  return {
    id: raw._id,
    title,
    summary,
    image: toSanityImage(raw.image),
    path: `${parentPath}/${raw.slug}`,
  };
}

export function toChildPageCards(
  raw: TRawChildPages,
  parentPath: string,
): TChildPageCard[] {
  return raw.map((page) => toChildPageCard(page, parentPath));
}
