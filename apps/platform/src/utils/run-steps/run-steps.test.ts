import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';

import { findFailedStep, stepStatusesFor, stepUpdatedAtFor } from './run-steps';

const ORDER = ['FIRST', 'SECOND', 'THIRD'] as const;

describe(stepStatusesFor, () => {
  it('reads each step in order, treating an unreported step as idle', () => {
    expect(
      stepStatusesFor(
        {
          THIRD: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
          FIRST: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
        },
        ORDER,
      ),
    ).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
    ]);
  });

  it('reads every step as idle before any has reported', () => {
    expect(stepStatusesFor(null, ORDER)).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
    ]);
  });
});

describe(stepUpdatedAtFor, () => {
  it('reads each step timestamp in order, undefined where none is recorded', () => {
    expect(
      stepUpdatedAtFor(
        {
          SECOND: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
        ORDER,
      ),
    ).toEqual([undefined, '2026-01-01T00:00:00.000Z', undefined]);
  });
});

describe(findFailedStep, () => {
  it('returns the first failed step', () => {
    expect(
      findFailedStep(
        [
          TENANT_PROVISIONING_STEP_STATUS.DONE,
          TENANT_PROVISIONING_STEP_STATUS.FAILED,
          TENANT_PROVISIONING_STEP_STATUS.FAILED,
        ],
        ORDER,
      ),
    ).toBe('SECOND');
  });

  it('returns undefined when no step failed', () => {
    expect(
      findFailedStep(
        [
          TENANT_PROVISIONING_STEP_STATUS.DONE,
          TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          TENANT_PROVISIONING_STEP_STATUS.IDLE,
        ],
        ORDER,
      ),
    ).toBeUndefined();
  });
});
