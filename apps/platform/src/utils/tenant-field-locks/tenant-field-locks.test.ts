import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { TENANT_FIELD_LOCK_KIND } from '@platform/constants/tenant';
import {
  mockDoneProvisioningSteps,
  mockFirstStepRunningProvisioningSteps,
  mockIdleProvisioningSteps,
  mockInvitedOwner,
  mockJoinedOwner,
  mockMapDomainFailedProvisioningSteps,
} from '@platform/testing/tenants/fixtures';

import {
  computeTenantFieldLocks,
  lockAllFields,
  type TTenantFieldLockReason,
} from './tenant-field-locks';

faker.seed(6006);

const MOCK_ERROR = faker.lorem.sentence();
const RUNNING: TTenantFieldLockReason = {
  kind: TENANT_FIELD_LOCK_KIND.RUNNING,
};
const SUCCEEDED: TTenantFieldLockReason = {
  kind: TENANT_FIELD_LOCK_KIND.SUCCEEDED,
};
const ARCHIVED: TTenantFieldLockReason = {
  kind: TENANT_FIELD_LOCK_KIND.ARCHIVED,
};

const everyFieldLockedBy = (reason: TTenantFieldLockReason) => ({
  name: reason,
  primaryDomain: reason,
  plan: reason,
  locale: reason,
  ownerEmail: reason,
});

describe(computeTenantFieldLocks, () => {
  it.each([
    ['every step is idle and provisioning is pending', true],
    ['there is no provisioning state at all', false],
  ])('locks nothing when %s', (_, hasSteps) => {
    const locks = computeTenantFieldLocks(
      hasSteps ? mockIdleProvisioningSteps() : null,
      hasSteps ? TENANT_PROVISIONING_STATUS.PENDING : null,
      undefined,
      false,
    );

    expect(locks).toEqual({});
  });

  it('leaves primaryDomain editable when MAP_DOMAIN itself failed', () => {
    const locks = computeTenantFieldLocks(
      mockMapDomainFailedProvisioningSteps(MOCK_ERROR),
      TENANT_PROVISIONING_STATUS.FAILED,
      undefined,
      false,
    );

    expect(locks).toEqual({});
  });

  it('locks primaryDomain once MAP_DOMAIN completed and a later step failed', () => {
    const steps = {
      ...mockDoneProvisioningSteps(),
      [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
        error: MOCK_ERROR,
      },
    };

    const locks = computeTenantFieldLocks(
      steps,
      TENANT_PROVISIONING_STATUS.FAILED,
      undefined,
      false,
    );

    expect(locks).toEqual({
      primaryDomain: {
        kind: TENANT_FIELD_LOCK_KIND.STEP,
        step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      },
    });
  });

  it.each([
    [
      'a step is running, the owner email included',
      mockFirstStepRunningProvisioningSteps(),
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    ],
    [
      'provisioning has started before any step has',
      mockIdleProvisioningSteps(),
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    ],
  ])('locks every field as running when %s', (_, steps, status) => {
    const locks = computeTenantFieldLocks(
      steps,
      status,
      mockInvitedOwner(),
      false,
    );

    expect(locks).toEqual(everyFieldLockedBy(RUNNING));
  });

  it('locks every field as succeeded once the owner has signed in', () => {
    const locks = computeTenantFieldLocks(
      mockDoneProvisioningSteps(),
      TENANT_PROVISIONING_STATUS.READY,
      mockJoinedOwner(),
      false,
    );

    expect(locks).toEqual(everyFieldLockedBy(SUCCEEDED));
  });

  it('leaves the owner email editable until the owner signs in', () => {
    const locks = computeTenantFieldLocks(
      mockDoneProvisioningSteps(),
      TENANT_PROVISIONING_STATUS.READY,
      mockInvitedOwner(),
      false,
    );

    expect(locks).toEqual({
      name: SUCCEEDED,
      primaryDomain: SUCCEEDED,
      plan: SUCCEEDED,
      locale: SUCCEEDED,
    });
  });

  it.each([
    ['provisioning has not started', null, null],
    [
      'provisioning has finished',
      mockDoneProvisioningSteps(),
      TENANT_PROVISIONING_STATUS.READY,
    ],
  ])(
    'locks primaryDomain for a custom main address when %s',
    (_, steps, status) => {
      const locks = computeTenantFieldLocks(
        steps,
        status,
        mockInvitedOwner(),
        true,
      );

      expect(locks.primaryDomain).toEqual({
        kind: TENANT_FIELD_LOCK_KIND.CUSTOM_MAIN_DOMAIN,
      });
    },
  );

  it('ignores a failed OWNER_ELEVATION step', () => {
    const locks = computeTenantFieldLocks(
      {
        ...mockDoneProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: MOCK_ERROR,
        },
      },
      TENANT_PROVISIONING_STATUS.READY,
      undefined,
      false,
    );

    expect(locks).toEqual(everyFieldLockedBy(SUCCEEDED));
  });
});

describe(lockAllFields, () => {
  it('locks every field with the given reason', () => {
    const locks = lockAllFields(ARCHIVED);

    expect(locks).toEqual(everyFieldLockedBy(ARCHIVED));
  });
});
