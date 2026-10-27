import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { faker } from '@faker-js/faker';

import { findFailedStep, stepStatusesFor, stepUpdatedAtFor } from './run-steps';

faker.seed(6006);

const { IDLE, RUNNING, DONE, FAILED } = TENANT_PROVISIONING_STEP_STATUS;
const ORDER = ['STEP_A', 'STEP_B', 'STEP_C'] as const;
const MOCK_UPDATED_AT = faker.date
  .past({ refDate: '2026-10-19T10:00:00.000Z' })
  .toISOString();

describe(stepStatusesFor, () => {
  it.each([
    {
      title: 'reads each step in order, treating an unreported step as idle',
      steps: { STEP_C: { status: DONE }, STEP_A: { status: RUNNING } },
      statuses: [RUNNING, IDLE, DONE],
    },
    {
      title: 'reads every step as idle before any has reported',
      steps: null,
      statuses: [IDLE, IDLE, IDLE],
    },
  ])('$title', ({ steps, statuses }) => {
    const result = stepStatusesFor(steps, ORDER);

    expect(result).toEqual(statuses);
  });
});

describe(stepUpdatedAtFor, () => {
  it('reads each step timestamp in order, undefined where none is recorded', () => {
    const result = stepUpdatedAtFor(
      { STEP_B: { status: DONE, updatedAt: MOCK_UPDATED_AT } },
      ORDER,
    );

    expect(result).toEqual([undefined, MOCK_UPDATED_AT, undefined]);
  });
});

describe(findFailedStep, () => {
  it.each([
    {
      title: 'returns the first failed step',
      statuses: [DONE, FAILED, FAILED],
      failedStep: 'STEP_B',
    },
    {
      title: 'returns undefined when no step failed',
      statuses: [DONE, RUNNING, IDLE],
      failedStep: undefined,
    },
  ])('$title', ({ statuses, failedStep }) => {
    const result = findFailedStep(statuses, ORDER);

    expect(result).toBe(failedStep);
  });
});
