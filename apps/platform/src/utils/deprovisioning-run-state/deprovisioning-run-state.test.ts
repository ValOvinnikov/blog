import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import {
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_PLUS_2_MIN_AT,
  MOCK_RUN_STARTED_AT,
} from '@platform/testing/tenants/fixtures';

import {
  deprovisioningOverallStatus,
  isRetryPending,
} from './deprovisioning-run-state';

const { IDLE, RUNNING, FAILED, DONE } = TENANT_PROVISIONING_STEP_STATUS;

const unfinishedRun = { startedAt: MOCK_RUN_PLUS_1_MIN_AT };
const finishedRun = {
  startedAt: MOCK_RUN_STARTED_AT,
  finishedAt: MOCK_RUN_PLUS_1_MIN_AT,
};

describe(deprovisioningOverallStatus, () => {
  it('reports RUNNING for an unfinished run whatever its steps say', () => {
    expect(deprovisioningOverallStatus([FAILED, IDLE], unfinishedRun)).toBe(
      RUNNING,
    );
  });

  it('reports FAILED for a finished run with a failed step', () => {
    expect(deprovisioningOverallStatus([DONE, FAILED], finishedRun)).toBe(
      FAILED,
    );
  });

  it('reports DONE for a finished run whose steps all finished', () => {
    expect(deprovisioningOverallStatus([DONE, DONE], finishedRun)).toBe(DONE);
  });

  it('reports IDLE with no run and no step started', () => {
    expect(deprovisioningOverallStatus([IDLE, IDLE], undefined)).toBe(IDLE);
  });
});

describe(isRetryPending, () => {
  it('is never pending without a request', () => {
    expect(isRetryPending(undefined, undefined)).toBe(false);
  });

  it('is pending for a request with no run yet', () => {
    expect(isRetryPending(MOCK_RUN_PLUS_2_MIN_AT, undefined)).toBe(true);
  });

  it('treats an unfinished run as the requested one, even when it started first', () => {
    expect(isRetryPending(MOCK_RUN_PLUS_2_MIN_AT, unfinishedRun)).toBe(false);
  });

  it('is pending for a request newer than the last finished run', () => {
    expect(isRetryPending(MOCK_RUN_PLUS_2_MIN_AT, finishedRun)).toBe(true);
  });

  it('is not pending for a request older than the last finished run', () => {
    expect(isRetryPending(MOCK_RUN_STARTED_AT, finishedRun)).toBe(false);
  });
});
