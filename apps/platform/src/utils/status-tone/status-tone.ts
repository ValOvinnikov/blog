import {
  FINDING_SEVERITY,
  type TFindingSeverity,
} from '@blog/config/constants';
import {
  TENANT_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TTenantStatus,
  type TTenantProvisioningStepStatus,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import type { TDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';

type TBadgeTone = 'ok' | 'warn' | 'bad' | 'neutral';

// Tone is a design-system concern, not display text — the visible label for
// each status/plan lives in `i18n/messages/en.json` under `tenantsTable`,
// keyed by these same enum values.
const TENANT_STATUS_TONE: Record<TTenantStatus, TBadgeTone> = {
  [TENANT_STATUS.ACTIVE]: 'ok',
  [TENANT_STATUS.SUSPENDED]: 'warn',
  [TENANT_STATUS.ARCHIVED]: 'neutral',
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

// A stall or an ambiguous membership is a completed check that needs an
// operator's attention, not a failure — provisioning succeeded and the
// tenant is live. There is deliberately no 'bad' tone here.
const OWNER_ELEVATION_TONE: Record<TElevateTenantOwnerOutcome, TBadgeTone> = {
  [ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED]: 'ok',
  [ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR]: 'ok',
  [ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE]: 'neutral',
  [ELEVATE_TENANT_OWNER_OUTCOME.STALLED]: 'warn',
  [ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP]: 'warn',
};

const FINDING_SEVERITY_TONE: Record<TFindingSeverity, TBadgeTone> = {
  [FINDING_SEVERITY.INFO]: 'neutral',
  [FINDING_SEVERITY.WARNING]: 'warn',
  [FINDING_SEVERITY.CRITICAL]: 'bad',
};

export const tenantStatusTone = (status: TTenantStatus) =>
  TENANT_STATUS_TONE[status];

export const findingSeverityTone = (severity: TFindingSeverity) =>
  FINDING_SEVERITY_TONE[severity];

export const provisioningStepTone = (
  status: Exclude<TTenantProvisioningStepStatus, 'FAILED'>,
) => PROVISIONING_STEP_TONE[status];

export const domainVerificationTone = (status: TDomainVerificationStatus) =>
  DOMAIN_VERIFICATION_TONE[status];

export const ownerElevationTone = (outcome: TElevateTenantOwnerOutcome) =>
  OWNER_ELEVATION_TONE[outcome];
