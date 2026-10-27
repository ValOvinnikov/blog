import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import {
  mockIdleProvisioningSteps,
  mockDoneProvisioningSteps,
  mockFirstStepRunningProvisioningSteps,
  mockInvitedOwner,
  mockJoinedOwner,
} from '@platform/testing/tenants/fixtures';

import { computeTenantFieldLocks, lockAllFields } from './tenant-field-locks';

describe(computeTenantFieldLocks, () => {
  it('locks nothing while every step is IDLE and provisioningStatus is not PROVISIONING', () => {
    expect(
      computeTenantFieldLocks(
        mockIdleProvisioningSteps(),
        TENANT_PROVISIONING_STATUS.PENDING,
        undefined,
      ),
    ).toEqual({});
  });

  it('locks nothing when provisioningSteps is null and provisioningStatus is null', () => {
    expect(computeTenantFieldLocks(null, null, undefined)).toEqual({});
  });

  it('locks nothing once MAP_DOMAIN is DONE — MAP_DOMAIN itself failing leaves primaryDomain editable (the real 409 case)', () => {
    const done = { status: TENANT_PROVISIONING_STEP_STATUS.DONE };
    const failedAtMapDomain = {
      ...mockIdleProvisioningSteps(),
      [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: done,
      [TENANT_PROVISIONING_STEP.SEED_CONTENT]: done,
      [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: done,
      [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
        error: 'Vercel deploy failed: 409 domain_already_in_use',
      },
    };

    expect(
      computeTenantFieldLocks(
        failedAtMapDomain,
        TENANT_PROVISIONING_STATUS.FAILED,
        undefined,
      ),
    ).toEqual({});
  });

  it('locks primaryDomain once MAP_DOMAIN completed and a later step failed', () => {
    const steps = {
      ...mockIdleProvisioningSteps(),
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
      computeTenantFieldLocks(
        steps,
        TENANT_PROVISIONING_STATUS.FAILED,
        undefined,
      ),
    ).toEqual({
      primaryDomain: {
        kind: 'step',
        step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      },
    });
  });

  it('locks every field with a "running" reason while a step is RUNNING, the owner email included', () => {
    expect(
      computeTenantFieldLocks(
        mockFirstStepRunningProvisioningSteps(),
        TENANT_PROVISIONING_STATUS.PROVISIONING,
        mockInvitedOwner(),
      ),
    ).toEqual({
      name: { kind: 'running' },
      primaryDomain: { kind: 'running' },
      plan: { kind: 'running' },
      locale: { kind: 'running' },
      ownerEmail: { kind: 'running' },
    });
  });

  it('locks every field with a "succeeded" reason once every step is DONE and the owner has signed in', () => {
    expect(
      computeTenantFieldLocks(
        mockDoneProvisioningSteps(),
        TENANT_PROVISIONING_STATUS.READY,
        mockJoinedOwner(),
      ),
    ).toEqual({
      name: { kind: 'succeeded' },
      primaryDomain: { kind: 'succeeded' },
      plan: { kind: 'succeeded' },
      locale: { kind: 'succeeded' },
      ownerEmail: { kind: 'succeeded' },
    });
  });

  it('leaves the owner email editable after every step is DONE until the owner signs in', () => {
    expect(
      computeTenantFieldLocks(
        mockDoneProvisioningSteps(),
        TENANT_PROVISIONING_STATUS.READY,
        mockInvitedOwner(),
      ),
    ).toEqual({
      name: { kind: 'succeeded' },
      primaryDomain: { kind: 'succeeded' },
      plan: { kind: 'succeeded' },
      locale: { kind: 'succeeded' },
    });
  });

  it('excludes OWNER_ELEVATION from the fold entirely — a 7th key never changes the result, even with a status the core sequence never produces', () => {
    const coreStepsDone = mockDoneProvisioningSteps();

    const withoutOwnerElevation = computeTenantFieldLocks(
      coreStepsDone,
      TENANT_PROVISIONING_STATUS.READY,
      undefined,
    );

    const withFailedOwnerElevation = computeTenantFieldLocks(
      {
        ...coreStepsDone,
        [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'should never happen',
        },
      },
      TENANT_PROVISIONING_STATUS.READY,
      undefined,
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
    expect(
      computeTenantFieldLocks(
        mockIdleProvisioningSteps(),
        TENANT_PROVISIONING_STATUS.PROVISIONING,
        undefined,
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

describe(lockAllFields, () => {
  it('locks every field with the given reason', () => {
    expect(lockAllFields({ kind: 'archived' })).toEqual({
      name: { kind: 'archived' },
      primaryDomain: { kind: 'archived' },
      plan: { kind: 'archived' },
      locale: { kind: 'archived' },
      ownerEmail: { kind: 'archived' },
    });
  });
});
