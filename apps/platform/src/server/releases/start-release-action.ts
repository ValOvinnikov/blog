'use server';

import {
  IS_PRODUCTION_RELEASE_ENABLED,
  RELEASE_FIELD_ERROR,
  RELEASE_OVERRIDE_REASON_MAX_LENGTH,
  RELEASE_REFUSAL,
  type TReleaseFieldError,
} from '@platform/constants/release';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  isReleaseOverrideRequired,
  isReleaseRunActive,
} from '@platform/utils/release-state/release-state';
import {
  ACTION_OUTCOME,
  RELEASE_CHANGE,
  type TActionResult,
} from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { z } from 'zod';

import { dispatchAuditedRelease } from './dispatch-audited-release';
import { getCandidateComparison } from './get-candidate-comparison';
import { getReleaseRun } from './get-release-run';
import { releaseVersionError } from './release-version-error';
import { resolveContrastStatus } from './resolve-contrast-status';

const startReleaseInputSchema = z.object({
  version: z.string().trim().max(64),
  overrideReason: z
    .string()
    .trim()
    .max(RELEASE_OVERRIDE_REASON_MAX_LENGTH)
    .optional(),
});

export type TStartReleaseInput = z.input<typeof startReleaseInputSchema>;

export type TStartReleaseResult = TActionResult<
  | typeof ACTION_OUTCOME.REFUSED
  | typeof ACTION_OUTCOME.UNAVAILABLE
  | typeof ACTION_OUTCOME.SERVER_ERROR,
  'version' | 'overrideReason',
  TReleaseFieldError,
  | typeof RELEASE_REFUSAL.RELEASE_RUNNING
  | typeof RELEASE_REFUSAL.RELEASES_PAUSED
>;

export const startReleaseAction = async (
  input: TStartReleaseInput,
): Promise<TStartReleaseResult> => {
  await requireSuperAdmin();
  if (!IS_PRODUCTION_RELEASE_ENABLED) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.RELEASES_PAUSED,
    };
  }

  const parsed = startReleaseInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }
  const { version, overrideReason } = parsed.data;

  const [comparison, releaseRun] = await Promise.all([
    getCandidateComparison(),
    getReleaseRun(),
  ]);
  if (!comparison.ok || !releaseRun.ok) {
    return toOutcome(ACTION_OUTCOME.UNAVAILABLE);
  }
  if (releaseRun.data && isReleaseRunActive(releaseRun.data.status)) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.RELEASE_RUNNING,
    };
  }

  const { headSha, lastTag, changes } = comparison.data;
  const versionError = releaseVersionError(version, lastTag);
  if (versionError) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { version: { reason: versionError, values: { lastTag } } },
    };
  }

  const isRenderingChanged = changes[RELEASE_CHANGE.RENDERING];
  const contrastStatus = await resolveContrastStatus({
    headSha,
    renderingChangedSinceTag: isRenderingChanged,
  });
  if (!contrastStatus.ok) return toOutcome(ACTION_OUTCOME.UNAVAILABLE);

  const isOverride = isReleaseOverrideRequired({
    isRenderingChanged,
    contrastStatus: contrastStatus.data,
  });
  if (isOverride && !overrideReason) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        overrideReason: { reason: RELEASE_FIELD_ERROR.REASON_REQUIRED },
      },
    };
  }

  const isDispatched = await dispatchAuditedRelease({
    version,
    headSha,
    isOverride,
    contrastStatus: contrastStatus.data,
    overrideReason,
  });
  if (!isDispatched) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
