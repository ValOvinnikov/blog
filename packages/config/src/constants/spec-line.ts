import type { TValueOf } from '@blog/config/utils';

export const SPEC_LINE_SEPARATORS = {
  DOT: 'DOT',
  PIPE: 'PIPE',
  BULLET: 'BULLET',
  SLASH: 'SLASH',
} as const;

export type TSpecLineSeparator = TValueOf<typeof SPEC_LINE_SEPARATORS>;

export const SPEC_LINE_SEPARATOR_CHARS: Record<TSpecLineSeparator, string> = {
  [SPEC_LINE_SEPARATORS.DOT]: '·',
  [SPEC_LINE_SEPARATORS.PIPE]: '|',
  [SPEC_LINE_SEPARATORS.BULLET]: '•',
  [SPEC_LINE_SEPARATORS.SLASH]: '/',
};
