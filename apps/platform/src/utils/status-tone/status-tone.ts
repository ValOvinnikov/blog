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
import type { TNavItemStatusTone } from '@platform/components/features/layout/nav-item-content';
import type { TStatusBadgeProps } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import {
  OWNER_STUDIO_ACCESS,
  type TPendingOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import {
  CONTRAST_STATUS,
  RELEASE_RUN_STATUS,
  type TContrastStatus,
  type TReleaseRunStatus,
} from '@platform/constants/release';
import type { TEmailItemStatus } from '@platform/utils/email-draft-changes/email-draft-changes';

export type TBadgeTone = NonNullable<TStatusBadgeProps['tone']>;

const TENANT_STATUS_TONE: Record<TTenantStatus, TBadgeTone> = {
  [TENANT_STATUS.ACTIVE]: BADGE_TONE.OK,
  [TENANT_STATUS.SUSPENDED]: BADGE_TONE.WARN,
  [TENANT_STATUS.ARCHIVED]: BADGE_TONE.NEUTRAL,
  [TENANT_STATUS.TRIAL]: BADGE_TONE.OK,
  [TENANT_STATUS.PAST_DUE]: BADGE_TONE.WARN,
};

const PROVISIONING_STEP_TONE: Record<
  TTenantProvisioningStepStatus,
  TBadgeTone
> = {
  [TENANT_PROVISIONING_STEP_STATUS.IDLE]: BADGE_TONE.NEUTRAL,
  [TENANT_PROVISIONING_STEP_STATUS.RUNNING]: BADGE_TONE.WARN,
  [TENANT_PROVISIONING_STEP_STATUS.DONE]: BADGE_TONE.OK,
  [TENANT_PROVISIONING_STEP_STATUS.FAILED]: BADGE_TONE.BAD,
};

const DOMAIN_VERIFICATION_TONE: Record<TDomainVerificationStatus, TBadgeTone> =
  {
    [DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED]: BADGE_TONE.NEUTRAL,
    [DOMAIN_VERIFICATION_STATUS.NOT_ADDED]: BADGE_TONE.NEUTRAL,
    [DOMAIN_VERIFICATION_STATUS.PENDING]: BADGE_TONE.WARN,
    [DOMAIN_VERIFICATION_STATUS.VERIFIED]: BADGE_TONE.OK,
    [DOMAIN_VERIFICATION_STATUS.ERROR]: BADGE_TONE.WARN,
  };

const CONTRAST_STATUS_TONE: Record<TContrastStatus, TBadgeTone> = {
  [CONTRAST_STATUS.GREEN]: BADGE_TONE.OK,
  [CONTRAST_STATUS.FAILED]: BADGE_TONE.BAD,
  [CONTRAST_STATUS.RUNNING]: BADGE_TONE.BRAND,
  [CONTRAST_STATUS.DUE]: BADGE_TONE.WARN,
  [CONTRAST_STATUS.NONE]: BADGE_TONE.NEUTRAL,
};

const RELEASE_RUN_STATUS_TONE: Record<TReleaseRunStatus, TBadgeTone> = {
  [RELEASE_RUN_STATUS.DISPATCHED]: BADGE_TONE.NEUTRAL,
  [RELEASE_RUN_STATUS.RUNNING]: BADGE_TONE.BRAND,
  [RELEASE_RUN_STATUS.SUCCEEDED]: BADGE_TONE.OK,
  [RELEASE_RUN_STATUS.FAILED]: BADGE_TONE.BAD,
};

const OWNER_STUDIO_ACCESS_TONE: Record<
  TPendingOwnerStudioAccess,
  TNavItemStatusTone
> = {
  [OWNER_STUDIO_ACCESS.INVITE_SENT]: BADGE_TONE.WARN,
  [OWNER_STUDIO_ACCESS.ACTIVATING]: BADGE_TONE.BRAND,
  [OWNER_STUDIO_ACCESS.STALLED]: BADGE_TONE.BAD,
};

const FINDING_SEVERITY_TONE: Record<TFindingSeverity, TBadgeTone> = {
  [FINDING_SEVERITY.INFO]: BADGE_TONE.NEUTRAL,
  [FINDING_SEVERITY.WARNING]: BADGE_TONE.WARN,
  [FINDING_SEVERITY.CRITICAL]: BADGE_TONE.BAD,
};

// The `sanity documents validate` CLI's own marker levels — distinct from
// `TFindingSeverity` (which is uppercase and has no 'error' member).
export type TSanityValidationMarkerLevel = 'error' | 'warning' | 'info';

const SANITY_VALIDATION_MARKER_TONE: Record<
  TSanityValidationMarkerLevel,
  TBadgeTone
> = {
  error: BADGE_TONE.BAD,
  warning: BADGE_TONE.WARN,
  info: BADGE_TONE.NEUTRAL,
};

const FIELD_STATUS_TONE: Record<TEmailItemStatus, TBadgeTone> = {
  default: BADGE_TONE.NEUTRAL,
  customised: BADGE_TONE.PLAN,
  unsaved: BADGE_TONE.WARN,
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

export const ownerStudioAccessTone = (access: TPendingOwnerStudioAccess) =>
  OWNER_STUDIO_ACCESS_TONE[access];
