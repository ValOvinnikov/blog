import type { TMaybeUndefined } from '@blog/config';
import type { TRawHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';

export type TPostHeading = {
  title: string;
  excerpt: TMaybeUndefined<string>;
};

export function toPostHeading(raw: TRawHeadingBlock): TPostHeading {
  return { title: raw.heading, excerpt: raw.supportingText ?? undefined };
}
