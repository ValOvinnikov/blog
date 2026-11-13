import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { MOCK_STRIPE_EVENT_ID } from '@blog/db/testing/tenants/billing';
import {
  BILLING_LOG,
  STRIPE_SIGNATURE_HEADER,
} from '@platform/constants/billing';
import { handleStripeEvent } from '@platform/server/billing/handle-stripe-event';
import {
  MOCK_STRIPE_SECRET_KEY,
  MOCK_STRIPE_WEBHOOK_SECRET,
  mockStripeEvent,
} from '@platform/testing/billing/fixtures';
import { mockedStripeEnv } from '@platform/testing/env/mocked-stripe-env';
import { createMockFaker } from '@platform/testing/mock-faker';
import { logger } from '@platform/utils/logger/logger';
import Stripe from 'stripe';

import { POST } from './route';

vi.mock('@platform/utils/stripe-env/stripe-env');

vi.mock('@platform/server/billing/handle-stripe-event', () => ({
  handleStripeEvent: vi.fn(),
}));

const MOCK_ENDPOINT = createMockFaker(6876).internet.url();
const MOCK_SIGNER = new Stripe(MOCK_STRIPE_SECRET_KEY);
const MOCK_PAYLOAD = JSON.stringify(mockStripeEvent());

const webhookRequest = (signature?: string): Request =>
  new Request(MOCK_ENDPOINT, {
    method: HTTP_METHOD.POST,
    body: MOCK_PAYLOAD,
    headers: signature ? { [STRIPE_SIGNATURE_HEADER]: signature } : {},
  });

const signedRequest = (secret = MOCK_STRIPE_WEBHOOK_SECRET): Request =>
  webhookRequest(
    MOCK_SIGNER.webhooks.generateTestHeaderString({
      payload: MOCK_PAYLOAD,
      secret,
    }),
  );

describe(POST, () => {
  beforeEach(() => {
    mockedStripeEnv.STRIPE_SECRET_KEY = MOCK_STRIPE_SECRET_KEY;
    mockedStripeEnv.STRIPE_WEBHOOK_SECRET = MOCK_STRIPE_WEBHOOK_SECRET;
  });

  it('handles a correctly signed event and answers 200', async () => {
    const response = await POST(signedRequest());

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(handleStripeEvent).toHaveBeenCalledWith(
      expect.any(Stripe),
      expect.objectContaining({ id: MOCK_STRIPE_EVENT_ID }),
    );
  });

  it.each([
    ['a missing signature', () => webhookRequest()],
    [
      'a signature made with another secret',
      () => signedRequest(MOCK_STRIPE_SECRET_KEY),
    ],
  ])('refuses %s and changes nothing', async (_case, request) => {
    const response = await POST(request());

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(handleStripeEvent).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      BILLING_LOG.WEBHOOK_SIGNATURE_INVALID,
    );
  });

  it.each(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] as const)(
    'answers 500 and logs without %s',
    async (name) => {
      mockedStripeEnv[name] = undefined;

      const response = await POST(signedRequest());

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(logger.error).toHaveBeenCalledWith(
        BILLING_LOG.WEBHOOK_SECRET_MISSING,
      );
    },
  );

  it('answers 500 so Stripe retries when handling fails', async () => {
    vi.mocked(handleStripeEvent).mockRejectedValue(new Error());

    const response = await POST(signedRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.WEBHOOK_HANDLER_FAILED,
      expect.objectContaining({ eventId: MOCK_STRIPE_EVENT_ID }),
    );
  });
});
