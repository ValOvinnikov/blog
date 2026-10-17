import type { TValueOf } from '@blog/config/utils';

export const FORM_STATUS = {
  IDLE: 'IDLE',
  SUBMITTING: 'SUBMITTING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
} as const;

export type TFormStatus = TValueOf<typeof FORM_STATUS>;
