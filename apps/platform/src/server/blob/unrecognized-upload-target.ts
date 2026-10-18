import { ACTION_OUTCOME } from '@blog/config';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';

export const UNRECOGNIZED_UPLOAD_TARGET_RESULT = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: UPLOAD_REFUSAL.UNRECOGNIZED_TARGET,
} as const;
