import {
  CONTENT_ALIGNMENT,
  type THeadingAlignment,
  type TMaybeNull,
} from '@blog/config';

export function toHeadingAlignment(
  raw: TMaybeNull<THeadingAlignment>,
): THeadingAlignment {
  return raw ?? CONTENT_ALIGNMENT.LEFT;
}
