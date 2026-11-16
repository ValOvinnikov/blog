import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import { ACTION_OUTCOME } from '@shinefold/config';

export const UNRECOGNIZED_UPLOAD_TARGET_RESULT = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: UPLOAD_REFUSAL.UNRECOGNIZED_TARGET,
} as const;
