import {
  FINDING_SEVERITY,
  type TFindingSeverity,
} from '@blog/config/constants';
import {
  TENANT_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantStatus,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type { TStatusBadgeProps } from '@platform/components/shared/status-badge';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import {
  OWNER_STUDIO_ACCESS,
  type TOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import {
  CONTRAST_STATUS,
  RELEASE_RUN_STATUS,
  type TContrastStatus,
  type TReleaseRunStatus,
} from '@platform/constants/release';
import type { TEmailItemStatus } from '@platform/utils/email-draft-changes/email-draft-changes';

type TBadgeTone = NonNullable<TStatusBadgeProps['tone']>;

const TENANT_STATUS_TONE: Record<TTenantStatus, TBadgeTone> = {
  [TENANT_STATUS.ACTIVE]: 'ok',
  [TENANT_STATUS.SUSPENDED]: 'warn',
  [TENANT_STATUS.ARCHIVED]: 'neutral',
};

const PROVISIONING_STEP_TONE: Record<
  TTenantProvisioningStepStatus,
  TBadgeTone
> = {
  [TENANT_PROVISIONING_STEP_STATUS.IDLE]: 'neutral',
  [TENANT_PROVISIONING_STEP_STATUS.RUNNING]: 'warn',
  [TENANT_PROVISIONING_STEP_STATUS.DONE]: 'ok',
  [TENANT_PROVISIONING_STEP_STATUS.FAILED]: 'bad',
};

const DOMAIN_VERIFICATION_TONE: Record<TDomainVerificationStatus, TBadgeTone> =
  {
    [DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED]: 'neutral',
    [DOMAIN_VERIFICATION_STATUS.NOT_ADDED]: 'neutral',
    [DOMAIN_VERIFICATION_STATUS.PENDING]: 'warn',
    [DOMAIN_VERIFICATION_STATUS.VERIFIED]: 'ok',
    [DOMAIN_VERIFICATION_STATUS.ERROR]: 'warn',
  };

const CONTRAST_STATUS_TONE: Record<TContrastStatus, TBadgeTone> = {
  [CONTRAST_STATUS.GREEN]: 'ok',
  [CONTRAST_STATUS.FAILED]: 'bad',
  [CONTRAST_STATUS.RUNNING]: 'brand',
  [CONTRAST_STATUS.DUE]: 'warn',
  [CONTRAST_STATUS.NONE]: 'neutral',
};

const RELEASE_RUN_STATUS_TONE: Record<TReleaseRunStatus, TBadgeTone> = {
  [RELEASE_RUN_STATUS.DISPATCHED]: 'neutral',
  [RELEASE_RUN_STATUS.RUNNING]: 'brand',
  [RELEASE_RUN_STATUS.SUCCEEDED]: 'ok',
  [RELEASE_RUN_STATUS.FAILED]: 'bad',
};

const OWNER_STUDIO_ACCESS_TONE: Record<TOwnerStudioAccess, TBadgeTone> = {
  [OWNER_STUDIO_ACCESS.INVITE_SENT]: 'warn',
  [OWNER_STUDIO_ACCESS.ACTIVATING]: 'brand',
  [OWNER_STUDIO_ACCESS.READY]: 'ok',
  [OWNER_STUDIO_ACCESS.STALLED]: 'bad',
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
  customised: 'plan',
  unsaved: 'warn',
};

export const tenantStatusTone = (status: TTenantStatus) =>
  TENANT_STATUS_TONE[status];

export const findingSeverityTone = (severity: TFindingSeverity) =>
  FINDING_SEVERITY_TONE[severity];

export const provisioningStepTone = (status: TTenantProvisioningStepStatus) =>
  PROVISIONING_STEP_TONE[status];

export const domainVerificationTone = (status: TDomainVerificationStatus) =>
  DOMAIN_VERIFICATION_TONE[status];

export const sanityValidationMarkerTone = (
  level: TSanityValidationMarkerLevel,
) => SANITY_VALIDATION_MARKER_TONE[level];

export const fieldStatusTone = (status: TEmailItemStatus) =>
  FIELD_STATUS_TONE[status];

export const contrastStatusTone = (status: TContrastStatus) =>
  CONTRAST_STATUS_TONE[status];

export const releaseRunStatusTone = (status: TReleaseRunStatus) =>
  RELEASE_RUN_STATUS_TONE[status];

export const ownerStudioAccessTone = (access: TOwnerStudioAccess) =>
  OWNER_STUDIO_ACCESS_TONE[access];
