import type { TValueOf } from '@blog/config/utils';

export const HEADER_CONTROL_STYLE = {
  OUTLINED: 'OUTLINED',
  SOFT: 'SOFT',
  PLAIN: 'PLAIN',
} as const;

export type THeaderControlStyle = TValueOf<typeof HEADER_CONTROL_STYLE>;
