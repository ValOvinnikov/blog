import { CONTENT_ALIGNMENT, type TContentAlignmentOf } from '@blog/config';

export type THeadingAlignment = TContentAlignmentOf<'LEFT' | 'CENTER'>;

export function toHeadingAlignment(
  raw: THeadingAlignment | null,
): THeadingAlignment {
  return raw ?? CONTENT_ALIGNMENT.LEFT;
}
