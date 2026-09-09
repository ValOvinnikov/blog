import type { TMaybeUndefined } from '@blog/config';
import {
  toRequiredSectionHeader,
  type TRawRequiredSectionHeader,
} from '@blog/service/shared/transformers/to-section-header';

export type TPostHeading = {
  title: string;
  excerpt: TMaybeUndefined<string>;
};

/**
 * Maps a `page_post`'s `sectionHeader` into its `title`/`excerpt` view-model
 * fields.
 */
export function toPostHeading(raw: TRawRequiredSectionHeader): TPostHeading {
  const header = toRequiredSectionHeader(raw);
  return { title: header.heading, excerpt: header.supportingText };
}
