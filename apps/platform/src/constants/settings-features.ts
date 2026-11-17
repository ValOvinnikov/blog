import type { TValueOf } from '@shinefold/config/utils';

export const SETTINGS_FEATURES_LOG = {
  PLAN_ENTITLEMENT_REJECTED: 'settings_features.plan_entitlement_rejected',
  UPDATE_AUDIT_FAILED: 'settings_features.update_audit_failed',
  UPDATE_FAILED: 'settings_features.update_failed',
  ANALYTICS_UPDATE_AUDIT_FAILED:
    'settings_features.analytics_update_audit_failed',
  ANALYTICS_UPDATE_FAILED: 'settings_features.analytics_update_failed',
} as const;

export const ANALYTICS_FIELD_ERROR = {
  ID_INVALID: 'ID_INVALID',
} as const;

export type TAnalyticsFieldErrorReason = TValueOf<typeof ANALYTICS_FIELD_ERROR>;
