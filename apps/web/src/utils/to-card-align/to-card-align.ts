import {
  CONTENT_ALIGNMENT,
  type TContentAlignment,
  type TMaybeUndefined,
} from '@shinefold/config';

export type TCardAlign = 'center' | 'left';

export const toCardAlign = (
  alignment: TMaybeUndefined<TContentAlignment>,
): TCardAlign => (alignment === CONTENT_ALIGNMENT.CENTER ? 'center' : 'left');
