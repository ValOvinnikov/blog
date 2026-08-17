import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantStatus,
} from '@blog/config/constants';

type TBadgeTone = 'ok' | 'warn' | 'neutral';

// Tone is a design-system concern, not display text — the visible label for
// each status/plan lives in `i18n/messages/en.json` under `tenantsTable`,
// keyed by these same enum values.
const TENANT_STATUS_TONE: Record<TTenantStatus, TBadgeTone> = {
  [TENANT_STATUS.ACTIVE]: 'ok',
  [TENANT_STATUS.SUSPENDED]: 'warn',
  [TENANT_STATUS.ARCHIVED]: 'neutral',
};

const TENANT_PLAN_TONE: Record<TTenantPlan, TBadgeTone> = {
  [TENANT_PLAN.FREE]: 'neutral',
  [TENANT_PLAN.GROWTH]: 'ok',
};

export const tenantStatusTone = (status: TTenantStatus) =>
  TENANT_STATUS_TONE[status];

export const tenantPlanTone = (plan: TTenantPlan) => TENANT_PLAN_TONE[plan];
