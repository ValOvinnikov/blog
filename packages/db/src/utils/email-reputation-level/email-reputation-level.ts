import {
  EMAIL_REPUTATION_LEVEL,
  EMAIL_REPUTATION_MIN_RESOLVED_COUNT,
  EMAIL_REPUTATION_THRESHOLDS,
  type TEmailReputationGateLevel,
  type TEmailReputationLevel,
  type TEmailReputationRateThresholds,
} from '@blog/db/constants';
import type { IEmailReputation } from '@blog/db/queries/email-usage/get-email-reputation/get-email-reputation';

const LEVELS_MOST_SEVERE_FIRST: readonly TEmailReputationGateLevel[] = [
  EMAIL_REPUTATION_LEVEL.STOP,
  EMAIL_REPUTATION_LEVEL.SLOW,
  EMAIL_REPUTATION_LEVEL.WARN,
];

function reachesLevel(
  level: TEmailReputationGateLevel,
  rate: number,
  thresholds: TEmailReputationRateThresholds,
): boolean {
  return rate >= thresholds[level];
}

export function emailReputationLevel({
  resolvedCount,
  bounceRate,
  complaintRate,
}: IEmailReputation): TEmailReputationLevel {
  if (resolvedCount < EMAIL_REPUTATION_MIN_RESOLVED_COUNT) {
    return EMAIL_REPUTATION_LEVEL.OK;
  }

  return (
    LEVELS_MOST_SEVERE_FIRST.find(
      (level) =>
        reachesLevel(
          level,
          bounceRate,
          EMAIL_REPUTATION_THRESHOLDS.bounceRate,
        ) ||
        reachesLevel(
          level,
          complaintRate,
          EMAIL_REPUTATION_THRESHOLDS.complaintRate,
        ),
    ) ?? EMAIL_REPUTATION_LEVEL.OK
  );
}
