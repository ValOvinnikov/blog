import type { TMaybeUndefined } from '@blog/config';
import {
  toRequiredSectionHeader,
  type TRawRequiredSectionHeader,
} from '@blog/service/shared/transformers/to-section-header';

export type TPostHeading = {
  title: TMaybeUndefined<string>;
  excerpt: TMaybeUndefined<string>;
};

/**
 * Maps a `page_post`'s `sectionHeader` into its `title`/`excerpt` view-model
 * fields, treating an entirely absent `sectionHeader` as both undefined.
 */
export function toPostHeading(
  raw: TRawRequiredSectionHeader | null | undefined,
): TPostHeading {
  if (!raw) return { title: undefined, excerpt: undefined };

  const header = toRequiredSectionHeader(raw);
  return { title: header.heading, excerpt: header.supportingText };
}
