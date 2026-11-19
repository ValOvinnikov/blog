import type { TValueOf } from '@shinefold/config/utils';

export const UNLINK_PROVIDER_OUTCOME = {
  UNLINKED: 'UNLINKED',
  LAST_METHOD: 'LAST_METHOD',
} as const;

export type TUnlinkProviderOutcome = TValueOf<typeof UNLINK_PROVIDER_OUTCOME>;
