import {
  CONTENT_ALIGNMENT,
  type THeadingAlignment,
  type TMaybeNull,
} from '@shinefold/config';

export function toHeadingAlignment(
  raw: TMaybeNull<THeadingAlignment>,
): THeadingAlignment {
  return raw ?? CONTENT_ALIGNMENT.LEFT;
}
