import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { idleProvisioningSteps } from '@platform/testing/tenants/fixtures';

import { computeTenantFieldLocks } from './tenant-field-locks';

describe(computeTenantFieldLocks, () => {
  it('locks nothing while every step is IDLE and provisioningStatus is not PROVISIONING', () => {
    expect(
      computeTenantFieldLocks(
        idleProvisioningSteps(),
        TENANT_PROVISIONING_STATUS.PENDING,
      ),
    ).toEqual({});
  });

  it('locks nothing when provisioningSteps is null and provisioningStatus is null', () => {
    expect(computeTenantFieldLocks(null, null)).toEqual({});
  });

  it('locks nothing once MAP_DOMAIN is DONE — MAP_DOMAIN itself failing leaves primaryDomain editable (the real 409 case)', () => {
    const done = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };
    const failedAtMapDomain = {
      ...idleProvisioningSteps(),
      [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: done,
      [TENANT_PROVISIONING_STEP.SEED_CONTENT]: done,
      [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: done,
      [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
        error: 'Vercel deploy failed: 409 domain_already_in_use',
      },
    };

    // primaryDomain — the field that actually caused the failure — stays
    // editable, since MAP_DOMAIN itself never reached DONE.
    expect(
      computeTenantFieldLocks(
        failedAtMapDomain,
        TENANT_PROVISIONING_STATUS.FAILED,
      ),
    ).toEqual({});
  });

  it('locks primaryDomain once MAP_DOMAIN completed and a later step failed', () => {
    const steps = {
      ...idleProvisioningSteps(),
      [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      },
      [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      },
      [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      },
      [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      },
      [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
        error: 'boom',
      },
    };

    expect(
      computeTenantFieldLocks(steps, TENANT_PROVISIONING_STATUS.FAILED),
    ).toEqual({
      primaryDomain: {
        kind: 'step',
        step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      },
    });
  });

  it('locks every field with a "running" reason while a step is RUNNING', () => {
    const steps = {
      ...idleProvisioningSteps(),
      [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
        status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      },
    };

    expect(
      computeTenantFieldLocks(steps, TENANT_PROVISIONING_STATUS.PROVISIONING),
    ).toEqual({
      name: { kind: 'running' },
      primaryDomain: { kind: 'running' },
      plan: { kind: 'running' },
      locale: { kind: 'running' },
      ownerEmail: { kind: 'running' },
    });
  });

  it('locks every field with a "succeeded" reason once every step is DONE', () => {
    const done = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };
    const steps = {
      [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: done,
      [TENANT_PROVISIONING_STEP.SEED_CONTENT]: done,
      [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: done,
      [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: done,
      [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: done,
      [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
        status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
      },
    };

    expect(
      computeTenantFieldLocks(steps, TENANT_PROVISIONING_STATUS.READY),
    ).toEqual({
      name: { kind: 'succeeded' },
      primaryDomain: { kind: 'succeeded' },
      plan: { kind: 'succeeded' },
      locale: { kind: 'succeeded' },
      ownerEmail: { kind: 'succeeded' },
    });
  });

  it('excludes OWNER_ELEVATION from the fold entirely — a 6th key never changes the result, even with a status the core sequence never produces', () => {
    const done = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };
    const coreStepsDone = {
      [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: done,
      [TENANT_PROVISIONING_STEP.SEED_CONTENT]: done,
      [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: done,
      [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: done,
      [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: done,
      [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
        status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
      },
    };

    const withoutOwnerElevation = computeTenantFieldLocks(
      coreStepsDone,
      TENANT_PROVISIONING_STATUS.READY,
    );

    // A hypothetical FAILED OWNER_ELEVATION entry is the strongest possible
    // proof the allowlist truly excludes it — if this leaked into the fold
    // (e.g. via `Object.values(steps ?? {})`), the state would flip to
    // 'FAILED' and every field lock below would change.
    const withFailedOwnerElevation = computeTenantFieldLocks(
      {
        ...coreStepsDone,
        [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'should never happen',
        },
      },
      TENANT_PROVISIONING_STATUS.READY,
    );

    expect(withoutOwnerElevation).toEqual({
      name: { kind: 'succeeded' },
      primaryDomain: { kind: 'succeeded' },
      plan: { kind: 'succeeded' },
      locale: { kind: 'succeeded' },
      ownerEmail: { kind: 'succeeded' },
    });
    expect(withFailedOwnerElevation).toEqual(withoutOwnerElevation);
  });

  it('locks every field with a "running" reason once provisioningStatus is PROVISIONING, even while every step is still IDLE', () => {
    // This is the actual regression: `beginTenantProvisioning` moves the
    // column to PROVISIONING before its runner reports any step, so the
    // steps map alone can't be trusted to decide whether provisioning is
    // in flight.
    expect(
      computeTenantFieldLocks(
        idleProvisioningSteps(),
        TENANT_PROVISIONING_STATUS.PROVISIONING,
      ),
    ).toEqual({
      name: { kind: 'running' },
      primaryDomain: { kind: 'running' },
      plan: { kind: 'running' },
      locale: { kind: 'running' },
      ownerEmail: { kind: 'running' },
    });
  });
});
