import {
  CAPABILITY,
  MODULE_PACK,
  type TCapability,
  type TModulePack,
} from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';

import { LOOK_FIELDS, type TLookField } from './look';

export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type TTenantStatus = TValueOf<typeof TENANT_STATUS>;

export type TSuspensionStatus =
  typeof TENANT_STATUS.ACTIVE | typeof TENANT_STATUS.SUSPENDED;

export const TENANT_PLAN = {
  FREE: 'FREE',
  GROWTH: 'GROWTH',
} as const;

export type TTenantPlan = TValueOf<typeof TENANT_PLAN>;

export const TENANT_DETAILS_UPDATE_OUTCOME = {
  UPDATED: 'UPDATED',
  DOMAIN_TAKEN: 'DOMAIN_TAKEN',
  DOMAIN_LOCKED: 'DOMAIN_LOCKED',
  DOMAIN_INVALID: 'DOMAIN_INVALID',
  PROVISIONING_STARTED: 'PROVISIONING_STARTED',
  OWNER_ALREADY_JOINED: 'OWNER_ALREADY_JOINED',
  OWNER_EMAIL_TAKEN: 'OWNER_EMAIL_TAKEN',
  OWNS_FREE_TENANT: 'OWNS_FREE_TENANT',
} as const;

// The ceiling a tenant's own `settings_features` toggles can never exceed.
export const PLAN_REGISTRY: Record<TTenantPlan, TCapability[]> = {
  [TENANT_PLAN.FREE]: [CAPABILITY.RATINGS, CAPABILITY.CONSENT_BANNER],
  [TENANT_PLAN.GROWTH]: [
    CAPABILITY.COMMENTS,
    CAPABILITY.RATINGS,
    CAPABILITY.BOOKMARKS,
    CAPABILITY.NEWSLETTER,
    CAPABILITY.ANALYTICS,
    CAPABILITY.CONSENT_BANNER,
    CAPABILITY.CONTACT_FORM,
  ],
};

// Includes the default locale.
export const PLAN_LOCALE_LIMIT: Record<TTenantPlan, number> = {
  [TENANT_PLAN.FREE]: 1,
  [TENANT_PLAN.GROWTH]: 3,
};

export type TPlanEntitlements = {
  lookFields: readonly TLookField[];
  modulePacks: readonly TModulePack[];
};

export const PLAN_ENTITLEMENTS: Record<TTenantPlan, TPlanEntitlements> = {
  [TENANT_PLAN.FREE]: {
    lookFields: ['preset', 'accentHue', 'logoAssetUrl', 'faviconAssetUrl'],
    modulePacks: [MODULE_PACK.CORE],
  },
  [TENANT_PLAN.GROWTH]: {
    lookFields: LOOK_FIELDS,
    modulePacks: [MODULE_PACK.CORE, MODULE_PACK.GROWTH],
  },
};
