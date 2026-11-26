import {
  CONTENT_ALIGNMENT,
  type TContentAlignment,
  type TMaybeUndefined,
} from '@shinefold/config';

export const toCenterOrLeftAlignment = (
  alignment: TMaybeUndefined<TContentAlignment>,
): Extract<TContentAlignment, 'LEFT' | 'CENTER'> =>
  alignment === CONTENT_ALIGNMENT.CENTER
    ? CONTENT_ALIGNMENT.CENTER
    : CONTENT_ALIGNMENT.LEFT;
