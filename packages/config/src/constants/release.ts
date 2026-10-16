import type { TValueOf } from '@blog/config/utils';

export const RELEASE_CHANGE = {
  RENDERING: 'RENDERING',
  DB_MIGRATION: 'DB_MIGRATION',
  SANITY_MIGRATION: 'SANITY_MIGRATION',
  ENV: 'ENV',
} as const;

export type TReleaseChange = TValueOf<typeof RELEASE_CHANGE>;

// RENDERING must match the contrast workflow's scope: a change outside it
// never makes a contrast run due.
export const RELEASE_WATCHED_PATHS: Record<TReleaseChange, readonly string[]> =
  {
    [RELEASE_CHANGE.RENDERING]: [
      'packages/ui/',
      'apps/web/',
      'packages/config/src/theme/',
      'configs/tailwind/',
    ],
    [RELEASE_CHANGE.DB_MIGRATION]: ['packages/db/migrations/'],
    [RELEASE_CHANGE.SANITY_MIGRATION]: ['packages/studio/migrations/'],
    [RELEASE_CHANGE.ENV]: [
      'apps/web/.env.example',
      'apps/platform/.env.example',
    ],
  };

export const CONTRAST_CHECK_OUTCOME = {
  PASS: 'PASS',
  FAIL: 'FAIL',
} as const;

export type TContrastCheckOutcome = TValueOf<typeof CONTRAST_CHECK_OUTCOME>;
