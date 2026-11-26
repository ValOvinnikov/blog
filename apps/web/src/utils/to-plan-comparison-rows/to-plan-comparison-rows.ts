import {
  CAPABILITY,
  getModuleCapability,
  isModuleTypeEntitled,
  MODULE_PACK_BY_TYPE,
  TENANT_PLAN,
  type TCapability,
  type TTenantPlan,
} from '@shinefold/config/constants';
import type { TValueOf } from '@shinefold/config/utils';
import {
  LOOK_FIELDS,
  PLAN_ENTITLEMENTS,
  PLAN_LOCALE_LIMIT,
  PLAN_REGISTRY,
  SUBSCRIBER_BAND_CEILINGS,
} from '@shinefold/db/constants';
import { PLAN_COMPARISON_ROW } from '@web/constants/pricing';
import { mapValues } from 'remeda';

type TPlanComparisonRow = TValueOf<typeof PLAN_COMPARISON_ROW>;

interface IPlanComparisonShare {
  count: number;
  total: number;
}

export type TPlanComparisonValue = boolean | number | IPlanComparisonShare;

export interface IPlanComparisonRow {
  row: TPlanComparisonRow;
  values: Record<TTenantPlan, TPlanComparisonValue>;
}

export const PLAN_COMPARISON_PLANS = Object.values(TENANT_PLAN);

const MODULE_TYPES = Object.keys(MODULE_PACK_BY_TYPE);

const hasCapabilities = (
  plan: TTenantPlan,
  ...capabilities: TCapability[]
): boolean =>
  capabilities.every((capability) => PLAN_REGISTRY[plan].includes(capability));

const isModuleTypeOnPlan = (type: string, plan: TTenantPlan): boolean => {
  const capability = getModuleCapability(type);
  return (
    isModuleTypeEntitled(type, PLAN_ENTITLEMENTS[plan].modulePacks) &&
    (!capability || hasCapabilities(plan, capability))
  );
};

const PLAN_COMPARISON_READERS: Record<
  TPlanComparisonRow,
  (plan: TTenantPlan) => TPlanComparisonValue
> = {
  [PLAN_COMPARISON_ROW.LANGUAGES]: (plan) => PLAN_LOCALE_LIMIT[plan],
  [PLAN_COMPARISON_ROW.SEATS]: (plan) => PLAN_ENTITLEMENTS[plan].seats,
  [PLAN_COMPARISON_ROW.CUSTOM_DOMAIN]: (plan) =>
    PLAN_ENTITLEMENTS[plan].hasCustomDomain,
  [PLAN_COMPARISON_ROW.NO_POWERED_BY_MARK]: (plan) =>
    !PLAN_ENTITLEMENTS[plan].hasPoweredByMark,
  [PLAN_COMPARISON_ROW.LOOK_SETTINGS]: (plan) => ({
    count: PLAN_ENTITLEMENTS[plan].lookFields.length,
    total: LOOK_FIELDS.length,
  }),
  [PLAN_COMPARISON_ROW.SECTION_TYPES]: (plan) =>
    MODULE_TYPES.filter((type) => isModuleTypeOnPlan(type, plan)).length,
  [PLAN_COMPARISON_ROW.OWN_ANALYTICS]: (plan) =>
    PLAN_ENTITLEMENTS[plan].hasOwnAnalytics,
  [PLAN_COMPARISON_ROW.OWN_SIGN_IN_APPS]: (plan) =>
    PLAN_ENTITLEMENTS[plan].hasOwnOAuthApps,
  [PLAN_COMPARISON_ROW.CONTACT_FORM]: (plan) =>
    hasCapabilities(plan, CAPABILITY.CONTACT_FORM),
  [PLAN_COMPARISON_ROW.READER_ACCOUNTS]: (plan) =>
    hasCapabilities(plan, CAPABILITY.READER_ACCOUNTS, CAPABILITY.BOOKMARKS),
  [PLAN_COMPARISON_ROW.NEWSLETTER_SUBSCRIBERS]: (plan) =>
    hasCapabilities(plan, CAPABILITY.NEWSLETTER)
      ? SUBSCRIBER_BAND_CEILINGS[0]
      : false,
  [PLAN_COMPARISON_ROW.TAKEAWAYS_PER_MONTH]: (plan) =>
    PLAN_ENTITLEMENTS[plan].takeawaysPerMonth,
};

export const toPlanComparisonRows = (): IPlanComparisonRow[] =>
  Object.values(PLAN_COMPARISON_ROW).map((row) => ({
    row,
    values: mapValues(TENANT_PLAN, PLAN_COMPARISON_READERS[row]),
  }));
