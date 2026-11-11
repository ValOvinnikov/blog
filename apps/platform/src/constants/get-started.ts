import type { TValueOf } from '@blog/config/utils';

export const GET_STARTED_STEP = {
  LOOK: 'LOOK',
  VOICE: 'VOICE',
  EDITOR_INVITE: 'EDITOR_INVITE',
  FIRST_POST: 'FIRST_POST',
} as const;

export type TGetStartedStep = TValueOf<typeof GET_STARTED_STEP>;
