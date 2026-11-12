import {
  CAPABILITY,
  MODULE_PACK,
  type TCapability,
  type TModulePack,
} from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';

import { LOOK_FIELD, LOOK_FIELDS, type TLookField } from './look';

export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
  TRIAL: 'TRIAL',
  PAST_DUE: 'PAST_DUE',
} as const;

export type TTenantStatus = TValueOf<typeof TENANT_STATUS>;

export const WRITABLE_TENANT_STATUSES = [
  TENANT_STATUS.ACTIVE,
  TENANT_STATUS.TRIAL,
  TENANT_STATUS.PAST_DUE,
] as const satisfies readonly TTenantStatus[];

export type TSuspensionStatus =
  typeof TENANT_STATUS.ACTIVE | typeof TENANT_STATUS.SUSPENDED;

export const TENANT_PLAN = {
  FREE: 'FREE',
  STARTER: 'STARTER',
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
  [TENANT_PLAN.FREE]: [CAPABILITY.CONSENT_BANNER],
  [TENANT_PLAN.STARTER]: [CAPABILITY.CONSENT_BANNER, CAPABILITY.CONTACT_FORM],
  [TENANT_PLAN.GROWTH]: [
    CAPABILITY.READER_ACCOUNTS,
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
  [TENANT_PLAN.STARTER]: 1,
  [TENANT_PLAN.GROWTH]: 3,
};

export const PLAN_MONTHLY_SENDS_PER_SUBSCRIBER: Record<TTenantPlan, number> = {
  [TENANT_PLAN.FREE]: 0,
  [TENANT_PLAN.STARTER]: 0,
  [TENANT_PLAN.GROWTH]: 6,
};

export const SUBSCRIBER_BAND_CEILINGS = [
  1_000, 2_500, 5_000, 10_000, 25_000,
] as const;

export type TPlanEntitlements = {
  lookFields: readonly TLookField[];
  modulePacks: readonly TModulePack[];
  hasPoweredByMark: boolean;
  hasCustomDomain: boolean;
  hasOwnOAuthApps: boolean;
  hasOwnAnalytics: boolean;
  seats: number;
};

const BASE_LOOK_FIELDS: readonly TLookField[] = [
  LOOK_FIELD.PRESET,
  LOOK_FIELD.ACCENT_HUE,
  LOOK_FIELD.BRAND_NAME,
  LOOK_FIELD.LOGO_ASSET_URL,
  LOOK_FIELD.FAVICON_ASSET_URL,
  LOOK_FIELD.COOKIE_SETTINGS_BUTTON,
];

export const PLAN_ENTITLEMENTS: Record<TTenantPlan, TPlanEntitlements> = {
  [TENANT_PLAN.FREE]: {
    lookFields: BASE_LOOK_FIELDS,
    modulePacks: [MODULE_PACK.CORE],
    hasPoweredByMark: true,
    hasCustomDomain: false,
    hasOwnOAuthApps: false,
    hasOwnAnalytics: false,
    seats: 1,
  },
  [TENANT_PLAN.STARTER]: {
    lookFields: BASE_LOOK_FIELDS,
    modulePacks: [MODULE_PACK.CORE, MODULE_PACK.STARTER],
    hasPoweredByMark: false,
    hasCustomDomain: true,
    hasOwnOAuthApps: false,
    hasOwnAnalytics: true,
    seats: 1,
  },
  [TENANT_PLAN.GROWTH]: {
    lookFields: LOOK_FIELDS,
    modulePacks: [MODULE_PACK.CORE, MODULE_PACK.STARTER, MODULE_PACK.GROWTH],
    hasPoweredByMark: false,
    hasCustomDomain: true,
    hasOwnOAuthApps: true,
    hasOwnAnalytics: true,
    seats: 3,
  },
};
