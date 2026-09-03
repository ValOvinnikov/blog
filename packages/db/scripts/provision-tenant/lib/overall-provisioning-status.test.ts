import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';

import { overallStatusFor } from './overall-provisioning-status';

describe(overallStatusFor, () => {
  it('returns READY when the last step (CREATE_WEBHOOK) finishes', () => {
    expect(
      overallStatusFor(
        TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ),
    ).toBe('READY');
  });

  it('returns FAILED when the last step (CREATE_WEBHOOK) fails', () => {
    expect(
      overallStatusFor(
        TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      ),
    ).toBe('FAILED');
  });

  it('returns undefined when CREATE_WEBHOOK is only RUNNING', () => {
    expect(
      overallStatusFor(
        TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ),
    ).toBeUndefined();
  });

  it('returns undefined for an earlier step succeeding', () => {
    expect(
      overallStatusFor(
        TENANT_PROVISIONING_STEP.MAP_DOMAIN,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ),
    ).toBeUndefined();
  });

  it('returns FAILED when an earlier step fails, not just the last one', () => {
    expect(
      overallStatusFor(
        TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      ),
    ).toBe('FAILED');
  });

  it('returns FAILED when the very first step fails', () => {
    expect(
      overallStatusFor(
        TENANT_PROVISIONING_STEP.SANITY_PROJECT,
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
      ),
    ).toBe('FAILED');
  });

  it('returns undefined for an earlier step only RUNNING', () => {
    expect(
      overallStatusFor(
        TENANT_PROVISIONING_STEP.SEED_CONTENT,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ),
    ).toBeUndefined();
  });
});
