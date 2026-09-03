import type { TValueOf } from '@blog/config/utils';

export const TENANT_PROVISIONING_STATUS = {
  PENDING: 'PENDING',
  PROVISIONING: 'PROVISIONING',
  READY: 'READY',
  FAILED: 'FAILED',
} as const;

export type TTenantProvisioningStatus = TValueOf<
  typeof TENANT_PROVISIONING_STATUS
>;

export const TENANT_PROVISIONING_STEP = {
  SANITY_PROJECT: 'SANITY_PROJECT',
  SEED_CONTENT: 'SEED_CONTENT',
  PERSIST_TOKEN: 'PERSIST_TOKEN',
  MAP_DOMAIN: 'MAP_DOMAIN',
  CREATE_WEBHOOK: 'CREATE_WEBHOOK',
  // Not one of the five core provisioning steps `overallStatusFor` and the
  // operator UI's step sequencing reason about — a recurring
  // post-provisioning check (`elevateTenantOwner`) that never touches the
  // tenant's overall `provisioningStatus`. See `TElevateTenantOwnerOutcome`
  // for its own outcome vocabulary, carried in this step's `detail`.
  OWNER_ELEVATION: 'OWNER_ELEVATION',
} as const;

export type TTenantProvisioningStep = TValueOf<typeof TENANT_PROVISIONING_STEP>;

export const TENANT_PROVISIONING_STEP_STATUS = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const;

export type TTenantProvisioningStepStatus = TValueOf<
  typeof TENANT_PROVISIONING_STEP_STATUS
>;

// Comfortably longer than `.github/workflows/provision-tenant.yml`'s
// `timeout-minutes: 20` — a run whose `startedAt` predates this window is
// treated as dead even if it never reported a FAILED step or a finish.
export const TENANT_PROVISIONING_RUN_STALE_AFTER_MINUTES = 30;

// Long enough to cover a Retry's own dispatch round-trip (including one
// that fails outright) before a FAILED step or a recorded finish is trusted
// as evidence of a dead run again — short relative to
// `TENANT_PROVISIONING_RUN_STALE_AFTER_MINUTES`, which instead catches a
// runner that reported nothing at all.
export const TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES = 2;

// Outcome of one `elevateTenantOwner` check, reported as the
// `OWNER_ELEVATION` step's `detail` (always alongside status DONE — a
// stall or an ambiguous membership is a completed check, not a failed
// step). Read by both `scripts/provision-tenant` and
// `scripts/recheck-tenant-owners`, and (via the tenant row) `apps/platform`.
export const ELEVATE_TENANT_OWNER_OUTCOME = {
  ELEVATED: 'ELEVATED',
  ALREADY_ADMINISTRATOR: 'ALREADY_ADMINISTRATOR',
  PENDING_ACCEPTANCE: 'PENDING_ACCEPTANCE',
  STALLED: 'STALLED',
  AMBIGUOUS_MEMBERSHIP: 'AMBIGUOUS_MEMBERSHIP',
} as const;

export type TElevateTenantOwnerOutcome = TValueOf<
  typeof ELEVATE_TENANT_OWNER_OUTCOME
>;
