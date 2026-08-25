import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantStatus,
} from '@blog/db';
import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';

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

const PROVISIONING_STEP_TONE: Record<
  Exclude<TTenantProvisioningStepStatus, 'FAILED'>,
  TBadgeTone
> = {
  [TENANT_PROVISIONING_STEP_STATUS.IDLE]: 'neutral',
  [TENANT_PROVISIONING_STEP_STATUS.RUNNING]: 'warn',
  [TENANT_PROVISIONING_STEP_STATUS.DONE]: 'ok',
};

const DOMAIN_VERIFICATION_TONE: Record<TDomainVerificationStatus, TBadgeTone> =
  {
    NOT_CONFIGURED: 'neutral',
    NOT_ADDED: 'neutral',
    PENDING: 'warn',
    VERIFIED: 'ok',
    ERROR: 'warn',
  };

export const tenantStatusTone = (status: TTenantStatus) =>
  TENANT_STATUS_TONE[status];

export const tenantPlanTone = (plan: TTenantPlan) => TENANT_PLAN_TONE[plan];

export const provisioningStepTone = (
  status: Exclude<TTenantProvisioningStepStatus, 'FAILED'>,
) => PROVISIONING_STEP_TONE[status];

export const domainVerificationTone = (status: TDomainVerificationStatus) =>
  DOMAIN_VERIFICATION_TONE[status];
