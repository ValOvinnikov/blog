import { faker } from '@faker-js/faker';
import {
  REVALIDATE_WEBHOOK_CHANGE,
  REVALIDATE_WEBHOOK_LOG,
} from '@worker/constants/revalidate-webhook';
import { createTenantRevalidateWebhook } from '@worker/steps/create-revalidate-webhook';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import { mockTenant } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';

import {
  reportRevalidateWebhookBackfill,
  runRevalidateWebhookStepForEach,
} from './revalidate-webhook-backfill';

vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('@worker/steps/create-revalidate-webhook');

faker.seed(7471);

const EVENTS = {
  finished: REVALIDATE_WEBHOOK_LOG.SYNC_FINISHED,
  failed: REVALIDATE_WEBHOOK_LOG.SYNC_FAILED,
};

function tenantWithId() {
  return mockTenant({ id: faker.string.uuid() });
}

describe(runRevalidateWebhookStepForEach, () => {
  it('sorts each tenant by whether the step changed its hook', async () => {
    const stale = tenantWithId();
    const current = tenantWithId();
    vi.mocked(createTenantRevalidateWebhook).mockImplementation(
      async (tenant) =>
        tenant.id === stale.id
          ? REVALIDATE_WEBHOOK_CHANGE.UPDATED
          : REVALIDATE_WEBHOOK_CHANGE.UNCHANGED,
    );

    const summary = await runRevalidateWebhookStepForEach(
      [stale, current],
      REVALIDATE_WEBHOOK_LOG.SYNC_TENANT_FAILED,
    );

    expect(summary).toEqual({
      updated: [stale.id],
      unchanged: [current.id],
      failed: [],
    });
  });

  it('logs a failed tenant under the given event and carries on', async () => {
    const failing = tenantWithId();
    const healthy = tenantWithId();
    vi.mocked(createTenantRevalidateWebhook).mockImplementation(
      async (tenant) => {
        if (tenant.id === failing.id) throw new Error(MOCK_SANITY_OUTAGE);
        return REVALIDATE_WEBHOOK_CHANGE.UPDATED;
      },
    );

    const summary = await runRevalidateWebhookStepForEach(
      [failing, healthy],
      REVALIDATE_WEBHOOK_LOG.SYNC_TENANT_FAILED,
    );

    expect(summary).toEqual({
      updated: [healthy.id],
      unchanged: [],
      failed: [failing.id],
    });
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      REVALIDATE_WEBHOOK_LOG.SYNC_TENANT_FAILED,
      expect.objectContaining({ tenantId: failing.id }),
    );
  });
});

describe(reportRevalidateWebhookBackfill, () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  it('logs the summary and exits cleanly when no tenant failed', async () => {
    const summary = {
      updated: [faker.string.uuid()],
      unchanged: [],
      failed: [],
    };

    await reportRevalidateWebhookBackfill(async () => summary, EVENTS);

    expect(logger.info).toHaveBeenCalledExactlyOnceWith(
      EVENTS.finished,
      summary,
    );
    expect(process.exitCode).toBeUndefined();
  });

  it('exits non-zero when a tenant failed', async () => {
    await reportRevalidateWebhookBackfill(
      async () => ({
        updated: [],
        unchanged: [],
        failed: [faker.string.uuid()],
      }),
      EVENTS,
    );

    expect(process.exitCode).toBe(1);
  });

  it('logs and exits non-zero when the backfill itself throws', async () => {
    await reportRevalidateWebhookBackfill(async () => {
      throw new Error(MOCK_SANITY_OUTAGE);
    }, EVENTS);

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      EVENTS.failed,
      expect.objectContaining({ error: expect.any(String) }),
    );
    expect(process.exitCode).toBe(1);
  });
});
