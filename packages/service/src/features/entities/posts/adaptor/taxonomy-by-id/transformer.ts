import type { TMaybeUndefined } from '@blog/config';
import type { InferResultType } from 'groqd';

import type { postTaxonomyByIdQuery } from './query';

export type TRawPostTaxonomyById = NonNullable<
  InferResultType<typeof postTaxonomyByIdQuery>
>;

export type TPostTaxonomySlugs = {
  tagSlugs: string[];
  topicSlug: TMaybeUndefined<string>;
};

export function toPostTaxonomySlugs(
  raw: TRawPostTaxonomyById,
): TPostTaxonomySlugs {
  return {
    tagSlugs: raw.tagSlugs.map((tag) => tag.slug),
    topicSlug: raw.topicSlug?.slug ?? undefined,
  };
}
