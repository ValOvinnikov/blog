import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import {
  PROVISIONING_STATE,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';
import { deriveProvisioningState } from '@blog/db/utils/derive-provisioning-state/derive-provisioning-state';
import { TENANT_FIELD_LOCK_KIND } from '@platform/constants/tenant';

export const ALL_FIELD_KEYS = [
  'name',
  'primaryDomain',
  'plan',
  'locale',
  'ownerEmail',
] as const;

export type TTenantFieldKey = (typeof ALL_FIELD_KEYS)[number];

export type TTenantFieldLockReason =
  | { kind: typeof TENANT_FIELD_LOCK_KIND.STEP; step: TTenantProvisioningStep }
  | { kind: typeof TENANT_FIELD_LOCK_KIND.RUNNING }
  | { kind: typeof TENANT_FIELD_LOCK_KIND.SUCCEEDED }
  // Never returned by computeTenantFieldLocks; TenantDetailsPanel overlays it.
  | { kind: typeof TENANT_FIELD_LOCK_KIND.ARCHIVED };

export type TTenantFieldLocks = Partial<
  Record<TTenantFieldKey, TTenantFieldLockReason>
>;

export const lockAllFields = (
  reason: TTenantFieldLockReason,
): TTenantFieldLocks => {
  return Object.fromEntries(
    ALL_FIELD_KEYS.map((key) => [key, reason]),
  ) as TTenantFieldLocks;
};

export const computeTenantFieldLocks = (
  steps: TMaybeNull<TTenantProvisioningState>,
  provisioningStatus: TMaybeNull<TTenantProvisioningStatus>,
  owner: TMaybeUndefined<TTenantOwnerMembership>,
): TTenantFieldLocks => {
  const state = deriveProvisioningState(provisioningStatus, steps);

  if (state === PROVISIONING_STATE.IDLE) {
    return {};
  }

  if (state === PROVISIONING_STATE.FAILED) {
    const locks: TTenantFieldLocks = {};

    if (
      steps?.[TENANT_PROVISIONING_STEP.MAP_DOMAIN]?.status ===
      TENANT_PROVISIONING_STEP_STATUS.DONE
    ) {
      locks.primaryDomain = {
        kind: TENANT_FIELD_LOCK_KIND.STEP,
        step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      };
    }

    return locks;
  }

  if (state === PROVISIONING_STATE.SUCCEEDED) {
    const { ownerEmail, ...locks } = lockAllFields({
      kind: TENANT_FIELD_LOCK_KIND.SUCCEEDED,
    });
    return owner?.hasSignedIn === false ? locks : { ...locks, ownerEmail };
  }

  return lockAllFields({ kind: TENANT_FIELD_LOCK_KIND.RUNNING });
};
