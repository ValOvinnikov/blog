import type { TReleaseRun } from '@platform/server/releases/get-release-run';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import type { TMaybeUndefined } from '@shinefold/config';

export const getReleaseRunAction =
  vi.fn<() => Promise<TReleaseResult<TMaybeUndefined<TReleaseRun>>>>();
