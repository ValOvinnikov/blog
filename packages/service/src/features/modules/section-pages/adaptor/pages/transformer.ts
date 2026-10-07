import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { sectionPagesQuery } from './query';
import type { TSectionPageCard } from './types';

export type TRawSectionPages = InferResultType<typeof sectionPagesQuery>;

function toSectionPageCard(
  raw: TRawSectionPages[number],
  parentPath: string,
): TSectionPageCard {
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

export function toSectionPageCards(
  raw: TRawSectionPages,
  parentPath: string,
): TSectionPageCard[] {
  return raw.map((page) => toSectionPageCard(page, parentPath));
}
