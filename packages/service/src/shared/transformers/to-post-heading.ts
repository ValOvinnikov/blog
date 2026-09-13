import type { TMaybeUndefined } from '@blog/config';
import type { TRawHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';

export type TPostHeading = {
  title: string;
  excerpt: TMaybeUndefined<string>;
};

/**
 * Maps a `page_post`'s `headingBlock` into its `title`/`excerpt` view-model
 * fields.
 */
export function toPostHeading(raw: TRawHeadingBlock): TPostHeading {
  return { title: raw.heading, excerpt: raw.supportingText ?? undefined };
}
