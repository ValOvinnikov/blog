import { TENANT_FIELD_LOCK_KIND } from '@platform/constants/tenant';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import {
  PROVISIONING_STATE,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
} from '@shinefold/db/constants';
import type { TTenantOwnerMembership } from '@shinefold/db/queries/memberships';
import type { TTenantProvisioningState } from '@shinefold/db/schema/tenants';
import { deriveProvisioningState } from '@shinefold/db/utils/derive-provisioning-state/derive-provisioning-state';
import { objectKeys } from '@shinefold/utils/primitives';

const IS_EDITABLE_AFTER_PROVISIONING = {
  name: false,
  primaryDomain: false,
  plan: true,
  locale: false,
  ownerEmail: false,
} as const;

export type TTenantFieldKey = keyof typeof IS_EDITABLE_AFTER_PROVISIONING;

export const ALL_FIELD_KEYS: readonly TTenantFieldKey[] = objectKeys(
  IS_EDITABLE_AFTER_PROVISIONING,
);

export type TTenantFieldLockReason =
  | { kind: typeof TENANT_FIELD_LOCK_KIND.STEP; step: TTenantProvisioningStep }
  | { kind: typeof TENANT_FIELD_LOCK_KIND.RUNNING }
  | { kind: typeof TENANT_FIELD_LOCK_KIND.SUCCEEDED }
  | { kind: typeof TENANT_FIELD_LOCK_KIND.CUSTOM_MAIN_DOMAIN }
  | { kind: typeof TENANT_FIELD_LOCK_KIND.SUBSCRIBED }
  // Never returned by computeTenantFieldLocks; TenantDetailsPanel overlays it.
  | { kind: typeof TENANT_FIELD_LOCK_KIND.ARCHIVED };

export type TTenantFieldLocks = Partial<
  Record<TTenantFieldKey, TTenantFieldLockReason>
>;

const lockFields = (
  keys: readonly TTenantFieldKey[],
  reason: TTenantFieldLockReason,
): TTenantFieldLocks => {
  return Object.fromEntries(
    keys.map((key) => [key, reason]),
  ) as TTenantFieldLocks;
};

export const lockAllFields = (
  reason: TTenantFieldLockReason,
): TTenantFieldLocks => {
  return lockFields(ALL_FIELD_KEYS, reason);
};

const computeProvisioningFieldLocks = (
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
    const isOwnerEmailEditable = owner?.hasSignedIn === false;
    const lockedKeys = ALL_FIELD_KEYS.filter(
      (key) =>
        !IS_EDITABLE_AFTER_PROVISIONING[key] &&
        !(key === 'ownerEmail' && isOwnerEmailEditable),
    );
    return lockFields(lockedKeys, { kind: TENANT_FIELD_LOCK_KIND.SUCCEEDED });
  }

  return lockAllFields({ kind: TENANT_FIELD_LOCK_KIND.RUNNING });
};

export type TTenantFieldLockFlags = {
  isPrimaryCustom: boolean;
  isSubscribed: boolean;
};

export const computeTenantFieldLocks = (
  steps: TMaybeNull<TTenantProvisioningState>,
  provisioningStatus: TMaybeNull<TTenantProvisioningStatus>,
  owner: TMaybeUndefined<TTenantOwnerMembership>,
  { isPrimaryCustom, isSubscribed }: TTenantFieldLockFlags,
): TTenantFieldLocks => {
  const locks = computeProvisioningFieldLocks(steps, provisioningStatus, owner);

  return {
    ...locks,
    ...(isPrimaryCustom && {
      primaryDomain: { kind: TENANT_FIELD_LOCK_KIND.CUSTOM_MAIN_DOMAIN },
    }),
    ...(isSubscribed && { plan: { kind: TENANT_FIELD_LOCK_KIND.SUBSCRIBED } }),
  };
};
