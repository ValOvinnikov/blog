import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { EMAIL_DELIVERY_OUTCOME } from '@blog/db/constants';
import { SITE_EMAIL_TAG_NAME } from '@blog/email';
import { faker } from '@faker-js/faker';
import {
  EMAIL_USAGE_LOG,
  RESEND_DELIVERY_EVENT_TYPE,
  RESEND_WEBHOOK_HEADER,
} from '@web/constants/email-usage';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { Webhook } from 'standardwebhooks';

import { POST } from './route';

const { recordEmailDeliveryOutcomeMock, envMock } = vi.hoisted(() => ({
  recordEmailDeliveryOutcomeMock: vi.fn(),
  envMock: {} as { RESEND_WEBHOOK_SECRET?: string },
}));

vi.mock('@blog/db', () => ({
  queries: {
    emailUsage: { recordEmailDeliveryOutcome: recordEmailDeliveryOutcomeMock },
  },
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

faker.seed(7161);

const buildSecret = (): string =>
  `whsec_${Buffer.from(faker.string.alphanumeric(32)).toString('base64')}`;

const MOCK_SECRET = buildSecret();
const MOCK_OTHER_SECRET = buildSecret();
const MOCK_EVENT_ID = `msg_${faker.string.alphanumeric(24)}`;
const MOCK_ERROR = new Error(faker.lorem.sentence());
const MOCK_ROUTE_URL = `${faker.internet.url({ appendSlash: false })}/api/email-delivery-events`;
const SITE_TAGS = { [SITE_EMAIL_TAG_NAME]: MOCK_TENANT_ID };

const eventBody = (
  type: string = RESEND_DELIVERY_EVENT_TYPE.DELIVERED,
  tags: Record<string, string> = SITE_TAGS,
): string =>
  JSON.stringify({
    type,
    created_at: faker.date.recent().toISOString(),
    data: { email_id: faker.string.uuid(), tags },
  });

const signedRequest = (
  rawBody: string,
  secret: string = MOCK_SECRET,
): Request => {
  const sentAt = new Date();
  return new Request(MOCK_ROUTE_URL, {
    method: HTTP_METHOD.POST,
    headers: {
      [RESEND_WEBHOOK_HEADER.ID]: MOCK_EVENT_ID,
      [RESEND_WEBHOOK_HEADER.TIMESTAMP]: String(
        Math.floor(sentAt.getTime() / 1000),
      ),
      [RESEND_WEBHOOK_HEADER.SIGNATURE]: new Webhook(secret).sign(
        MOCK_EVENT_ID,
        sentAt,
        rawBody,
      ),
    },
    body: rawBody,
  });
};

describe(POST, () => {
  beforeEach(() => {
    envMock.RESEND_WEBHOOK_SECRET = MOCK_SECRET;
    recordEmailDeliveryOutcomeMock.mockResolvedValue(true);
  });

  it.each([
    [RESEND_DELIVERY_EVENT_TYPE.DELIVERED, EMAIL_DELIVERY_OUTCOME.DELIVERED],
    [RESEND_DELIVERY_EVENT_TYPE.BOUNCED, EMAIL_DELIVERY_OUTCOME.BOUNCED],
    [RESEND_DELIVERY_EVENT_TYPE.COMPLAINED, EMAIL_DELIVERY_OUTCOME.COMPLAINED],
  ])(
    'records a %s event against the tagged site',
    async (type, expectedOutcome) => {
      const response = await POST(signedRequest(eventBody(type)));

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(recordEmailDeliveryOutcomeMock).toHaveBeenCalledExactlyOnceWith(
        MOCK_EVENT_ID,
        MOCK_TENANT_ID,
        expectedOutcome,
      );
    },
  );

  it.each([
    [
      'unsigned',
      () =>
        new Request(MOCK_ROUTE_URL, {
          method: HTTP_METHOD.POST,
          body: eventBody(),
        }),
    ],
    [
      'signed with another secret',
      () => signedRequest(eventBody(), MOCK_OTHER_SECRET),
    ],
    [
      'changed after signing',
      () =>
        new Request(MOCK_ROUTE_URL, {
          method: HTTP_METHOD.POST,
          headers: signedRequest(eventBody()).headers,
          body: eventBody(RESEND_DELIVERY_EVENT_TYPE.BOUNCED),
        }),
    ],
  ])(
    'refuses and logs a request that is %s, writing nothing',
    async (_case, createRequest) => {
      const response = await POST(createRequest());

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(recordEmailDeliveryOutcomeMock).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        EMAIL_USAGE_LOG.WEBHOOK_SIGNATURE_INVALID,
      );
    },
  );

  it.each([
    ['no tags', {}],
    ['a site tag that is not a site id', { [SITE_EMAIL_TAG_NAME]: 'x' }],
  ])('refuses and logs an event with %s', async (_case, tags) => {
    const response = await POST(signedRequest(eventBody(undefined, tags)));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(recordEmailDeliveryOutcomeMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      EMAIL_USAGE_LOG.WEBHOOK_SITE_TAG_MISSING,
      expect.objectContaining({ eventId: MOCK_EVENT_ID }),
    );
  });

  it('acknowledges an event that is not a delivery outcome without recording it', async () => {
    const response = await POST(signedRequest(eventBody('email.opened')));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(recordEmailDeliveryOutcomeMock).not.toHaveBeenCalled();
  });

  it('logs and fails when the outcome cannot be recorded, so Resend retries', async () => {
    recordEmailDeliveryOutcomeMock.mockRejectedValue(MOCK_ERROR);

    const response = await POST(signedRequest(eventBody()));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      EMAIL_USAGE_LOG.DELIVERY_OUTCOME_RECORD_FAILED,
      expect.objectContaining({ eventId: MOCK_EVENT_ID, error: MOCK_ERROR }),
    );
  });

  it('logs and fails without a configured secret', async () => {
    envMock.RESEND_WEBHOOK_SECRET = undefined;

    const response = await POST(signedRequest(eventBody()));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(recordEmailDeliveryOutcomeMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      EMAIL_USAGE_LOG.WEBHOOK_SECRET_MISSING,
    );
  });
});
