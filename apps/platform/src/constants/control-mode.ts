import type { TValueOf } from '@shinefold/config/utils';

export const CONTROL_MODE = {
  EDITABLE: 'EDITABLE',
  READ_ONLY: 'READ_ONLY',
  DISABLED: 'DISABLED',
} as const;

export type TControlMode = TValueOf<typeof CONTROL_MODE>;
