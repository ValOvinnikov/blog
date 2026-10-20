import { ACTION_OUTCOME, type TOutcome } from '@blog/config';
import { RELEASE_REFUSAL } from '@platform/constants/release';
import type { TStartReleaseResult } from '@platform/server/releases/start-release-action';

const REFUSAL_KEYS = {
  [RELEASE_REFUSAL.RELEASE_RUNNING]: 'alreadyRunning',
  [RELEASE_REFUSAL.RELEASES_PAUSED]: 'releasesPaused',
} satisfies Record<
  | typeof RELEASE_REFUSAL.RELEASE_RUNNING
  | typeof RELEASE_REFUSAL.RELEASES_PAUSED,
  string
>;

type TReleaseFailure = Exclude<
  TStartReleaseResult,
  TOutcome<typeof ACTION_OUTCOME.SUCCESS>
>;

export const releaseFailureKey = (result: TReleaseFailure) => {
  switch (result.outcome) {
    case ACTION_OUTCOME.REFUSED:
      return REFUSAL_KEYS[result.reason];
    case ACTION_OUTCOME.UNAVAILABLE:
      return 'githubUnavailable';
    case ACTION_OUTCOME.INVALID:
      return 'invalid';
    case ACTION_OUTCOME.SERVER_ERROR:
      return 'startFailed';
  }
};
