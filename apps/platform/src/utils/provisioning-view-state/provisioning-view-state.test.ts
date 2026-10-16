import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TProvisioningRun } from '@blog/db/schema/tenants';
import { idleProvisioningSteps } from '@platform/testing/tenants/fixtures';

import { provisioningViewState } from './provisioning-view-state';

describe(provisioningViewState, () => {
  describe('isAwaitingRunner', () => {
    it('is true while a dispatched run has been admitted but the workflow has not started it', () => {
      const { isAwaitingRunner } = provisioningViewState(
        {
          ...idleProvisioningSteps(),
          run: { admittedAt: '2026-10-15T13:00:00.000Z' } as TProvisioningRun,
        },
        TENANT_PROVISIONING_STATUS.PROVISIONING,
      );

      expect(isAwaitingRunner).toBe(true);
    });

    it('is true for an admitted retry that still carries the previous run start', () => {
      const { isAwaitingRunner } = provisioningViewState(
        {
          ...idleProvisioningSteps(),
          run: {
            startedAt: '2026-10-15T12:00:00.000Z',
            finishedAt: '2026-10-15T12:05:00.000Z',
            admittedAt: '2026-10-15T13:00:00.000Z',
          },
        },
        TENANT_PROVISIONING_STATUS.PROVISIONING,
      );

      expect(isAwaitingRunner).toBe(true);
    });

    it('is false once the workflow has started the run', () => {
      const { isAwaitingRunner } = provisioningViewState(
        {
          ...idleProvisioningSteps(),
          run: { startedAt: '2026-10-15T13:01:00.000Z' },
        },
        TENANT_PROVISIONING_STATUS.PROVISIONING,
      );

      expect(isAwaitingRunner).toBe(false);
    });

    it('is false when no run is in progress', () => {
      const { isAwaitingRunner } = provisioningViewState(
        {
          ...idleProvisioningSteps(),
          run: { admittedAt: '2026-10-15T13:00:00.000Z' } as TProvisioningRun,
        },
        TENANT_PROVISIONING_STATUS.FAILED,
      );

      expect(isAwaitingRunner).toBe(false);
    });
  });
});
