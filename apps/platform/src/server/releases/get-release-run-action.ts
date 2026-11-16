'use server';

import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import type { TMaybeUndefined } from '@shinefold/config';

import { getReleaseRun, type TReleaseRun } from './get-release-run';
import type { TReleaseResult } from './release-result';

export const getReleaseRunAction = async (): Promise<
  TReleaseResult<TMaybeUndefined<TReleaseRun>>
> => {
  await requireSuperAdmin();
  return getReleaseRun();
};
