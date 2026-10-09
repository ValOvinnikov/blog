import {
  DOMAIN_VERIFICATION_STATUS,
  FINDING_SEVERITY,
  type TDomainVerificationStatus,
  type TFindingSeverity,
} from '@blog/config/constants';
import {
  TENANT_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantStatus,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type { TEmailItemStatus } from '@platform/utils/email-draft/email-draft';

type TBadgeTone = 'ok' | 'warn' | 'bad' | 'neutral' | 'brand';

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
    [DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED]: 'neutral',
    [DOMAIN_VERIFICATION_STATUS.NOT_ADDED]: 'neutral',
    [DOMAIN_VERIFICATION_STATUS.PENDING]: 'warn',
    [DOMAIN_VERIFICATION_STATUS.VERIFIED]: 'ok',
    [DOMAIN_VERIFICATION_STATUS.ERROR]: 'warn',
  };

const FINDING_SEVERITY_TONE: Record<TFindingSeverity, TBadgeTone> = {
  [FINDING_SEVERITY.INFO]: 'neutral',
  [FINDING_SEVERITY.WARNING]: 'warn',
  [FINDING_SEVERITY.CRITICAL]: 'bad',
};

// The `sanity documents validate` CLI's own marker levels — distinct from
// `TFindingSeverity` (which is uppercase and has no 'error' member).
export type TSanityValidationMarkerLevel = 'error' | 'warning' | 'info';

const SANITY_VALIDATION_MARKER_TONE: Record<
  TSanityValidationMarkerLevel,
  TBadgeTone
> = {
  error: 'bad',
  warning: 'warn',
  info: 'neutral',
};

const FIELD_STATUS_TONE: Record<TEmailItemStatus, TBadgeTone> = {
  default: 'neutral',
  customised: 'brand',
  unsaved: 'warn',
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

export const sanityValidationMarkerTone = (
  level: TSanityValidationMarkerLevel,
) => SANITY_VALIDATION_MARKER_TONE[level];

export const fieldStatusTone = (status: TEmailItemStatus) =>
  FIELD_STATUS_TONE[status];
