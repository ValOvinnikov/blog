import { CONTENT_ALIGNMENT, type TContentAlignment } from '@shinefold/config';

export const ALIGN_JUSTIFY = {
  [CONTENT_ALIGNMENT.LEFT]: 'justify-start',
  [CONTENT_ALIGNMENT.CENTER]: 'justify-center',
  [CONTENT_ALIGNMENT.RIGHT]: 'justify-end',
} as const satisfies Record<TContentAlignment, string>;
