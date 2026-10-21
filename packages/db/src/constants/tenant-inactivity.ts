import type { TValueOf } from '@blog/config/utils';

export const INACTIVITY_STAGE = {
  SUSPENSION_WARNING: 'SUSPENSION_WARNING',
  SUSPENSION: 'SUSPENSION',
  DELETION_NOTICE: 'DELETION_NOTICE',
  DEPROVISIONING: 'DEPROVISIONING',
} as const;

export type TInactivityStage = TValueOf<typeof INACTIVITY_STAGE>;

export type TStampedInactivityStage = Exclude<
  TInactivityStage,
  typeof INACTIVITY_STAGE.DEPROVISIONING
>;

export const DAY_MS = 24 * 60 * 60 * 1000;

export const INACTIVITY_STAGE_DAY: Record<TInactivityStage, number> = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: 23,
  [INACTIVITY_STAGE.SUSPENSION]: 30,
  [INACTIVITY_STAGE.DELETION_NOTICE]: 50,
  [INACTIVITY_STAGE.DEPROVISIONING]: 60,
};

export const SUSPENSION_REASON = {
  INACTIVITY: 'INACTIVITY',
  OPERATOR: 'OPERATOR',
} as const;

export type TSuspensionReason = TValueOf<typeof SUSPENSION_REASON>;
