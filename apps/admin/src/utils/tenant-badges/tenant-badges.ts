import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantStatus,
} from '@blog/config/constants';

type TBadgeTone = 'ok' | 'warn' | 'neutral';

const TENANT_STATUS_BADGE: Record<
  TTenantStatus,
  { tone: TBadgeTone; label: string }
> = {
  [TENANT_STATUS.ACTIVE]: { tone: 'ok', label: 'Active' },
  [TENANT_STATUS.SUSPENDED]: { tone: 'warn', label: 'Suspended' },
};

const TENANT_PLAN_BADGE: Record<
  TTenantPlan,
  { tone: TBadgeTone; label: string }
> = {
  [TENANT_PLAN.FREE]: { tone: 'neutral', label: 'Free' },
  [TENANT_PLAN.GROWTH]: { tone: 'ok', label: 'Growth' },
};

export const tenantStatusBadge = (status: TTenantStatus) =>
  TENANT_STATUS_BADGE[status];

export const tenantPlanBadge = (plan: TTenantPlan) => TENANT_PLAN_BADGE[plan];
