import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import type { TTenantProvisioningSteps } from '@blog/db/schema/tenants';

export type TTenantFieldKey =
  'name' | 'slug' | 'primaryDomain' | 'plan' | 'locale' | 'ownerEmail';

export type TTenantFieldLockReason =
  | { kind: 'step'; step: TTenantProvisioningStep }
  | { kind: 'running' }
  | { kind: 'succeeded' };

export type TTenantFieldLocks = Partial<
  Record<TTenantFieldKey, TTenantFieldLockReason>
>;

const ALL_FIELD_KEYS: TTenantFieldKey[] = [
  'name',
  'slug',
  'primaryDomain',
  'plan',
  'locale',
  'ownerEmail',
];

// Mirrors `packages/db`'s own (unexported) `deriveProvisioningState` —
// provisioning never revisits a step once it moves past it, so at most one
// step is ever FAILED at a time and every step after it stays IDLE.
const deriveProvisioningState = (
  steps: TTenantProvisioningSteps | null,
): 'IDLE' | 'RUNNING' | 'FAILED' | 'SUCCEEDED' => {
  const stepStates = Object.values(steps ?? {});

  if (
    stepStates.length === 0 ||
    stepStates.every(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.IDLE,
    )
  ) {
    return 'IDLE';
  }

  if (
    stepStates.some(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.FAILED,
    )
  ) {
    return 'FAILED';
  }

  if (
    stepStates.every(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.DONE,
    )
  ) {
    return 'SUCCEEDED';
  }

  return 'RUNNING';
};

/**
 * The client-side mirror of `packages/db`'s `updateTenantDetails` per-field
 * lock rules: while provisioning is FAILED, only a field an already-completed
 * step baked into an external resource locks (`slug` once `DEPLOY_STUDIO` is
 * DONE, `primaryDomain` once `MAP_DOMAIN` is DONE) — the field that actually
 * caused the failure stays editable. RUNNING/SUCCEEDED lock every field,
 * matching that function's blanket `provisioning-started` rejection.
 */
export const computeTenantFieldLocks = (
  steps: TTenantProvisioningSteps | null,
): TTenantFieldLocks => {
  const state = deriveProvisioningState(steps);

  if (state === 'IDLE') {
    return {};
  }

  if (state === 'FAILED') {
    const locks: TTenantFieldLocks = {};

    if (
      steps?.[TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]?.status ===
      TENANT_PROVISIONING_STEP_STATUS.DONE
    ) {
      locks.slug = {
        kind: 'step',
        step: TENANT_PROVISIONING_STEP.DEPLOY_STUDIO,
      };
    }

    if (
      steps?.[TENANT_PROVISIONING_STEP.MAP_DOMAIN]?.status ===
      TENANT_PROVISIONING_STEP_STATUS.DONE
    ) {
      locks.primaryDomain = {
        kind: 'step',
        step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      };
    }

    return locks;
  }

  const reason: TTenantFieldLockReason =
    state === 'SUCCEEDED' ? { kind: 'succeeded' } : { kind: 'running' };

  return Object.fromEntries(
    ALL_FIELD_KEYS.map((key) => [key, reason]),
  ) as TTenantFieldLocks;
};
