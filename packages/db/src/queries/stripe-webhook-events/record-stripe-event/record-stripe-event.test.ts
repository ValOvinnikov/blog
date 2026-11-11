import { STRIPE_EVENT_RECORD_OUTCOME } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_OTHER_STRIPE_EVENT_ID,
  MOCK_STRIPE_EVENT_ID,
} from '@blog/db/testing/tenants/billing';

import { recordStripeEvent } from './record-stripe-event';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.stripeWebhookEvents);
});

describe(recordStripeEvent, () => {
  it('records an event id it has not seen', async () => {
    const outcome = await recordStripeEvent(MOCK_STRIPE_EVENT_ID);

    expect(outcome).toBe(STRIPE_EVENT_RECORD_OUTCOME.RECORDED);
  });

  it('records exactly one of two concurrent deliveries of an event', async () => {
    const outcomes = await Promise.all([
      recordStripeEvent(MOCK_STRIPE_EVENT_ID),
      recordStripeEvent(MOCK_STRIPE_EVENT_ID),
    ]);

    expect(outcomes).toEqual(
      expect.arrayContaining([
        STRIPE_EVENT_RECORD_OUTCOME.RECORDED,
        STRIPE_EVENT_RECORD_OUTCOME.ALREADY_HANDLED,
      ]),
    );
  });

  describe('an event already handled', () => {
    beforeEach(async () => {
      await recordStripeEvent(MOCK_STRIPE_EVENT_ID);
    });

    it('reports the same event id as already handled', async () => {
      const outcome = await recordStripeEvent(MOCK_STRIPE_EVENT_ID);

      expect(outcome).toBe(STRIPE_EVENT_RECORD_OUTCOME.ALREADY_HANDLED);
    });

    it('records another event id', async () => {
      const outcome = await recordStripeEvent(MOCK_OTHER_STRIPE_EVENT_ID);

      expect(outcome).toBe(STRIPE_EVENT_RECORD_OUTCOME.RECORDED);
    });
  });
});
