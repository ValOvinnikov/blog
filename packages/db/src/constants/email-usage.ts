import type { TValueOf } from '@blog/config/utils';

export const EMAIL_DELIVERY_OUTCOME = {
  DELIVERED: 'DELIVERED',
  BOUNCED: 'BOUNCED',
  COMPLAINED: 'COMPLAINED',
} as const;

export type TEmailDeliveryOutcome = TValueOf<typeof EMAIL_DELIVERY_OUTCOME>;

export const EMAIL_REPUTATION_WINDOW_DAYS = 7;

export const EMAIL_REPUTATION_MIN_RESOLVED_COUNT = 20;

export const EMAIL_REPUTATION_LEVEL = {
  OK: 'OK',
  WARN: 'WARN',
  SLOW: 'SLOW',
  STOP: 'STOP',
} as const;

export type TEmailReputationLevel = TValueOf<typeof EMAIL_REPUTATION_LEVEL>;

export type TEmailReputationGateLevel = Exclude<
  TEmailReputationLevel,
  typeof EMAIL_REPUTATION_LEVEL.OK
>;

export type TEmailReputationRateThresholds = Record<
  TEmailReputationGateLevel,
  number
>;

// Below the provider's own review and pause levels, so the gate trips first.
export const EMAIL_REPUTATION_THRESHOLDS: Record<
  'bounceRate' | 'complaintRate',
  TEmailReputationRateThresholds
> = {
  bounceRate: {
    [EMAIL_REPUTATION_LEVEL.WARN]: 0.02,
    [EMAIL_REPUTATION_LEVEL.SLOW]: 0.03,
    [EMAIL_REPUTATION_LEVEL.STOP]: 0.04,
  },
  complaintRate: {
    [EMAIL_REPUTATION_LEVEL.WARN]: 0.0005,
    [EMAIL_REPUTATION_LEVEL.SLOW]: 0.0008,
    [EMAIL_REPUTATION_LEVEL.STOP]: 0.001,
  },
};
