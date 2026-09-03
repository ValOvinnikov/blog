import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';

export type TTenantFieldKey =
  'name' | 'primaryDomain' | 'plan' | 'locale' | 'ownerEmail';

export type TTenantFieldLockReason =
  | { kind: 'step'; step: TTenantProvisioningStep }
  | { kind: 'running' }
  | { kind: 'succeeded' }
  // Never produced by `computeTenantFieldLocks` itself — the tenant's
  // archived state is a separate, stronger lock `TenantDetailsPanel`
  // overlays on top, reusing this same reason vocabulary.
  | { kind: 'archived' };

export type TTenantFieldLocks = Partial<
  Record<TTenantFieldKey, TTenantFieldLockReason>
>;

export const ALL_FIELD_KEYS: TTenantFieldKey[] = [
  'name',
  'primaryDomain',
  'plan',
  'locale',
  'ownerEmail',
];

// The five core provisioning steps `run.ts`'s workflow actually sequences —
// hardcoded rather than derived from `TENANT_PROVISIONING_STEP` (which also
// carries `OWNER_ELEVATION`, a recurring post-provisioning check with no
// bearing on this state machine) so this fold can't silently pick up a
// future unrelated step key the same way.
const CORE_PROVISIONING_STEPS: TTenantProvisioningStep[] = [
  TENANT_PROVISIONING_STEP.SANITY_PROJECT,
  TENANT_PROVISIONING_STEP.SEED_CONTENT,
  TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
  TENANT_PROVISIONING_STEP.MAP_DOMAIN,
  TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
];

// Mirrors `packages/db`'s own (unexported) `deriveProvisioningState` —
// provisioning never revisits a step once it moves past it, so at most one
// step is ever FAILED at a time and every step after it stays IDLE. A
// workflow can be dispatched (`provisioningStatus` moved to PROVISIONING by
// `beginTenantProvisioning`) before its runner reports its first step —
// every step is still IDLE for that whole window, so the column, not the
// steps map, is the only signal a workflow is already running; first match
// wins, same as the db-side function.
const deriveProvisioningState = (
  provisioningStatus: TTenantProvisioningStatus | null,
  steps: TTenantProvisioningState | null,
): 'IDLE' | 'RUNNING' | 'FAILED' | 'SUCCEEDED' => {
  if (provisioningStatus === TENANT_PROVISIONING_STATUS.PROVISIONING) {
    return 'RUNNING';
  }

  const stepStates = CORE_PROVISIONING_STEPS.map(
    (step) => steps?.[step],
  ).filter((state) => state !== undefined);

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
 * step baked into an external resource locks (`primaryDomain` once
 * `MAP_DOMAIN` is DONE) — the field that actually caused the failure stays
 * editable. RUNNING/SUCCEEDED lock every field, matching that function's
 * blanket `provisioning-started` rejection.
 */
export const computeTenantFieldLocks = (
  steps: TTenantProvisioningState | null,
  provisioningStatus: TTenantProvisioningStatus | null,
): TTenantFieldLocks => {
  const state = deriveProvisioningState(provisioningStatus, steps);

  if (state === 'IDLE') {
    return {};
  }

  if (state === 'FAILED') {
    const locks: TTenantFieldLocks = {};

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
