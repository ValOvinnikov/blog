import type { TValueOf } from '@blog/config/utils';

export const VOICE_FIELD_ERROR = {
  REJECTED: 'REJECTED',
} as const;

export type TVoiceFieldErrorReason = TValueOf<typeof VOICE_FIELD_ERROR>;
