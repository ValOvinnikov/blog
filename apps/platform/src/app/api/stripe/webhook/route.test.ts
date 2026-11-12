import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import {
  BILLING_LOG,
  STRIPE_SIGNATURE_HEADER,
} from '@platform/constants/billing';
import { handleStripeEvent } from '@platform/server/billing/handle-stripe-event';
import {
  MOCK_STRIPE_EVENT_ID,
  MOCK_STRIPE_SECRET_KEY,
  MOCK_STRIPE_WEBHOOK_SECRET,
  mockStripeEvent,
} from '@platform/testing/billing/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';
import Stripe from 'stripe';

import { POST } from './route';

vi.mock('@platform/utils/stripe-env/stripe-env', () => ({ stripeEnv: {} }));
vi.mock('@platform/server/billing/handle-stripe-event', () => ({
  handleStripeEvent: vi.fn(),
}));

const mockedStripeEnv: Partial<Record<keyof typeof stripeEnv, string>> =
  stripeEnv;
const signer = new Stripe(MOCK_STRIPE_SECRET_KEY);
const payload = JSON.stringify(mockStripeEvent());

const webhookRequest = (signature?: string): Request =>
  new Request('https://platform.example.com/api/stripe/webhook', {
    method: HTTP_METHOD.POST,
    body: payload,
    headers: signature ? { [STRIPE_SIGNATURE_HEADER]: signature } : {},
  });

const signedRequest = (secret = MOCK_STRIPE_WEBHOOK_SECRET): Request =>
  webhookRequest(signer.webhooks.generateTestHeaderString({ payload, secret }));

describe(POST, () => {
  beforeEach(() => {
    mockedStripeEnv.STRIPE_SECRET_KEY = MOCK_STRIPE_SECRET_KEY;
    mockedStripeEnv.STRIPE_WEBHOOK_SECRET = MOCK_STRIPE_WEBHOOK_SECRET;
    vi.mocked(handleStripeEvent).mockReset().mockResolvedValue(undefined);
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.warn).mockReset();
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
