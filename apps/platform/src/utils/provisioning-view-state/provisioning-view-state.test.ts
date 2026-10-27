import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TProvisioningRun } from '@blog/db/schema/tenants';
import {
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_PLUS_2_MIN_AT,
  MOCK_RUN_PLUS_4_MIN_AT,
  MOCK_RUN_STARTED_AT,
  mockDoneProvisioningSteps,
  mockIdleProvisioningSteps,
  mockMapDomainFailedProvisioningSteps,
} from '@platform/testing/tenants/fixtures';

import { provisioningViewState } from './provisioning-view-state';

const { PROVISIONING, FAILED, PENDING, READY } = TENANT_PROVISIONING_STATUS;
const { SANITY_PROJECT, SEED_CONTENT, OWNER_ELEVATION } =
  TENANT_PROVISIONING_STEP;
const STEP_STATUS = TENANT_PROVISIONING_STEP_STATUS;
const MOCK_NETWORK_ERROR = 'fetch failed';
const MOCK_DOMAINS_API_ERROR = 'Vercel Domains API returned 500';

const MOCK_ADMITTED_RUN: TProvisioningRun = {
  startedAt: MOCK_RUN_STARTED_AT,
  admittedAt: MOCK_RUN_PLUS_2_MIN_AT,
};

describe(provisioningViewState, () => {
  describe('ownerElevationOutcome', () => {
    it.each([
      ['has not reported yet', mockIdleProvisioningSteps()],
      ['provisioningSteps is null', null],
    ])('is undefined when %s', (_label, provisioningSteps) => {
      const state = provisioningViewState(provisioningSteps, PENDING);

      expect(state.ownerElevationOutcome).toBeUndefined();
    });

    it('reads the detail off the OWNER_ELEVATION step once reported', () => {
      const state = provisioningViewState(
        {
          ...mockIdleProvisioningSteps(),
          [OWNER_ELEVATION]: {
            status: STEP_STATUS.DONE,
            detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
          },
        },
        PENDING,
      );

      expect(state.ownerElevationOutcome).toBe(
        ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      );
    });

    it('leaves a ready tenant ready whatever the owner elevation outcome', () => {
      const state = provisioningViewState(
        {
          ...mockDoneProvisioningSteps(),
          [OWNER_ELEVATION]: {
            status: STEP_STATUS.DONE,
            detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
          },
        },
        READY,
      );

      expect(state.isOverallFailed).toBe(false);
      expect(state.isProvisioningRunning).toBe(false);
      expect(state.displayOverallStatus).toBe(STEP_STATUS.DONE);
    });
  });

  describe('step data', () => {
    it('exposes provisioningRun read off provisioningSteps.run', () => {
      const run = {
        startedAt: MOCK_RUN_STARTED_AT,
        finishedAt: MOCK_RUN_PLUS_1_MIN_AT,
      };
      const state = provisioningViewState(
        { ...mockIdleProvisioningSteps(), run },
        PENDING,
      );

      expect(state.provisioningRun).toEqual(run);
    });

    it('exposes stepUpdatedAt in core step order', () => {
      const state = provisioningViewState(
        {
          ...mockIdleProvisioningSteps(),
          [SANITY_PROJECT]: {
            status: STEP_STATUS.DONE,
            updatedAt: MOCK_RUN_PLUS_1_MIN_AT,
          },
        },
        PENDING,
      );

      expect(state.stepUpdatedAt[0]).toBe(MOCK_RUN_PLUS_1_MIN_AT);
      expect(state.stepUpdatedAt[1]).toBeUndefined();
    });
  });

  describe('status derivation', () => {
    it('reports allIdle and IDLE overall status when every step is idle', () => {
      const state = provisioningViewState(mockIdleProvisioningSteps(), PENDING);

      expect(state.allIdle).toBe(true);
      expect(state.isOverallFailed).toBe(false);
      expect(state.displayOverallStatus).toBe(STEP_STATUS.IDLE);
    });

    it.each([
      ['other steps are idle', {}],
      [
        'another step still reads RUNNING',
        { [SANITY_PROJECT]: { status: STEP_STATUS.RUNNING } },
      ],
    ])(
      'reports a failure and classifies its error when %s',
      (_label, steps) => {
        const state = provisioningViewState(
          {
            ...mockIdleProvisioningSteps(),
            ...steps,
            [SEED_CONTENT]: {
              status: STEP_STATUS.FAILED,
              error: MOCK_NETWORK_ERROR,
            },
          },
          FAILED,
        );

        expect(state.isOverallFailed).toBe(true);
        expect(state.failedStepError).toBe(MOCK_NETWORK_ERROR);
        expect(state.errorKind).toBe('network');
      },
    );

    it('ignores a stale FAILED step while provisioningStatus is non-terminal', () => {
      const state = provisioningViewState(
        {
          ...mockIdleProvisioningSteps(),
          [SANITY_PROJECT]: {
            status: STEP_STATUS.FAILED,
            error: MOCK_NETWORK_ERROR,
          },
        },
        PENDING,
      );

      expect(state.isOverallFailed).toBe(false);
      expect(state.failedStepError).toBeUndefined();
      expect(state.errorKind).toBeUndefined();
    });

    it('masks a stale FAILED step and reports RUNNING once a retry is PROVISIONING', () => {
      const state = provisioningViewState(
        mockMapDomainFailedProvisioningSteps(MOCK_DOMAINS_API_ERROR),
        PROVISIONING,
      );

      expect(state.isProvisioningRunning).toBe(true);
      expect(state.isOverallFailed).toBe(false);
      expect(state.displayOverallStatus).toBe(STEP_STATUS.RUNNING);
      expect(state.stepStatuses[3]).toBe(STEP_STATUS.FAILED);
      expect(state.displayStepStatuses[3]).toBe(STEP_STATUS.IDLE);
    });

    it('keeps a step FAILED in displayStepStatuses once the tenant is FAILED', () => {
      const state = provisioningViewState(
        mockMapDomainFailedProvisioningSteps(MOCK_DOMAINS_API_ERROR),
        FAILED,
      );

      expect(state.isOverallFailed).toBe(true);
      expect(state.displayStepStatuses[3]).toBe(STEP_STATUS.FAILED);
    });
  });

  describe('isAwaitingRunner', () => {
    it.each([
      {
        name: 'a dispatched run is admitted but not yet started',
        run: MOCK_ADMITTED_RUN,
        status: PROVISIONING,
        isAwaitingRunner: true,
      },
      {
        name: 'an admitted retry still carries the previous run start',
        run: { ...MOCK_ADMITTED_RUN, finishedAt: MOCK_RUN_PLUS_1_MIN_AT },
        status: PROVISIONING,
        isAwaitingRunner: true,
      },
      {
        name: 'the workflow has started the run',
        run: { startedAt: MOCK_RUN_PLUS_4_MIN_AT },
        status: PROVISIONING,
        isAwaitingRunner: false,
      },
      {
        name: 'no run is in progress',
        run: MOCK_ADMITTED_RUN,
        status: FAILED,
        isAwaitingRunner: false,
      },
    ])(
      'is $isAwaitingRunner when $name',
      ({ run, status, isAwaitingRunner }) => {
        const state = provisioningViewState(
          { ...mockIdleProvisioningSteps(), run },
          status,
        );

        expect(state.isAwaitingRunner).toBe(isAwaitingRunner);
      },
    );
  });
});
