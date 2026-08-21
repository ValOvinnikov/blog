import { CAPABILITY, type TCapability } from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';

export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type TTenantStatus = TValueOf<typeof TENANT_STATUS>;

export const TENANT_PLAN = {
  FREE: 'FREE',
  GROWTH: 'GROWTH',
} as const;

export type TTenantPlan = TValueOf<typeof TENANT_PLAN>;

// Which capabilities each plan entitles a tenant to — the hard ceiling a
// tenant's own `settings_features` toggles can never exceed, regardless of
// what the tenant would otherwise enable. Lives here rather than
// `@blog/config` because it keys off `TENANT_PLAN`, which this package owns
// (config sits below db in the dependency graph and cannot import it).
export const PLAN_REGISTRY: Record<TTenantPlan, TCapability[]> = {
  [TENANT_PLAN.FREE]: [
    CAPABILITY.COMMENTS,
    CAPABILITY.RATINGS,
    CAPABILITY.BOOKMARKS,
  ],
  [TENANT_PLAN.GROWTH]: [
    CAPABILITY.COMMENTS,
    CAPABILITY.RATINGS,
    CAPABILITY.BOOKMARKS,
    CAPABILITY.NEWSLETTER,
    CAPABILITY.ANALYTICS,
  ],
};
