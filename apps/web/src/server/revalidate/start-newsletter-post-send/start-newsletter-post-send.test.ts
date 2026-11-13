import { SANITY_WEBHOOK_OPERATION } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import {
  REVALIDATE_LOG,
  STARTER_DOCUMENT_ID_PREFIX,
} from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { enqueueNewsletterPostSend } from '@web/server/revalidate/enqueue-newsletter-post-send/enqueue-newsletter-post-send';
import { isCapabilityEnabledForTenant } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_SUSPENDED_TENANT,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { startNewsletterPostSend } from './start-newsletter-post-send';

const {
  getTenantByIdMock,
  getEmailNewPostsMock,
  claimNewsletterPostSendMock,
  releaseNewsletterPostSendMock,
} = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
  getEmailNewPostsMock: vi.fn(),
  claimNewsletterPostSendMock: vi.fn(),
  releaseNewsletterPostSendMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    emailConfig: { getEmailNewPosts: getEmailNewPostsMock },
    newsletterPostSends: {
      claimNewsletterPostSend: claimNewsletterPostSendMock,
      releaseNewsletterPostSend: releaseNewsletterPostSendMock,
    },
  },
}));

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
);

vi.mock(
  '@web/server/revalidate/enqueue-newsletter-post-send/enqueue-newsletter-post-send',
  () => ({ enqueueNewsletterPostSend: vi.fn() }),
);

faker.seed(7164);

const MOCK_POST_ID = faker.string.uuid();
const MOCK_STARTER_POST_ID = `${STARTER_DOCUMENT_ID_PREFIX}${faker.lorem.word()}`;
const MOCK_OTHER_TYPE = faker.string.alphanumeric(12);
const MOCK_CLAIMED_AT = faker.date.recent();

const FIRST_PUBLISH = {
  operation: SANITY_WEBHOOK_OPERATION.CREATE,
  type: POST_TYPE,
  id: MOCK_POST_ID,
  tenantId: MOCK_TENANT_ID,
};

const enqueueMock = vi.mocked(enqueueNewsletterPostSend);
const isCapabilityEnabledMock = vi.mocked(isCapabilityEnabledForTenant);
const loggerErrorMock = vi.mocked(logger.error);

describe(startNewsletterPostSend, () => {
  beforeEach(() => {
    getTenantByIdMock.mockResolvedValue(mockTenant());
    isCapabilityEnabledMock.mockResolvedValue(true);
    getEmailNewPostsMock.mockResolvedValue(true);
    claimNewsletterPostSendMock.mockResolvedValue({
      claimedAt: MOCK_CLAIMED_AT,
    });
    enqueueMock.mockResolvedValue(true);
  });

  it("starts the worker's send with the claim on a post's first publish", async () => {
    await startNewsletterPostSend(FIRST_PUBLISH);

    expect(claimNewsletterPostSendMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
    );
    expect(enqueueMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      postId: MOCK_POST_ID,
      claimedAt: MOCK_CLAIMED_AT.toISOString(),
    });
    expect(releaseNewsletterPostSendMock).not.toHaveBeenCalled();
  });

  it.each([
    ['an edit', { operation: SANITY_WEBHOOK_OPERATION.UPDATE }],
    ['an unpublish', { operation: SANITY_WEBHOOK_OPERATION.DELETE }],
    ['an event with no operation', { operation: null }],
    ['a starter post', { id: MOCK_STARTER_POST_ID }],
    ['a document that is not a post', { type: MOCK_OTHER_TYPE }],
    ['a post with no resolved tenant', { tenantId: undefined }],
  ])('claims nothing on %s', async (_label, event) => {
    await startNewsletterPostSend({ ...FIRST_PUBLISH, ...event });

    expect(claimNewsletterPostSendMock).not.toHaveBeenCalled();
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it('claims nothing for an archived site', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await startNewsletterPostSend(FIRST_PUBLISH);

    expect(claimNewsletterPostSendMock).not.toHaveBeenCalled();
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'that is suspended',
      () => getTenantByIdMock.mockResolvedValue(MOCK_SUSPENDED_TENANT),
    ],
    [
      'whose plan or toggle leaves the newsletter off',
      () => isCapabilityEnabledMock.mockResolvedValue(false),
    ],
    [
      'that does not email new posts',
      () => getEmailNewPostsMock.mockResolvedValue(false),
    ],
  ])(
    'keeps the claim and starts nothing for a site %s',
    async (_label, arrange) => {
      arrange();

      await startNewsletterPostSend(FIRST_PUBLISH);

      expect(claimNewsletterPostSendMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
      );
      expect(enqueueMock).not.toHaveBeenCalled();
      expect(releaseNewsletterPostSendMock).not.toHaveBeenCalled();
    },
  );

  it('starts nothing for a post already claimed', async () => {
    claimNewsletterPostSendMock.mockResolvedValue(null);

    await startNewsletterPostSend(FIRST_PUBLISH);

    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it('logs and resolves when the claim fails', async () => {
    claimNewsletterPostSendMock.mockRejectedValue(MOCK_ERROR);

    await expect(
      startNewsletterPostSend(FIRST_PUBLISH),
    ).resolves.toBeUndefined();

    expect(enqueueMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      REVALIDATE_LOG.NEWSLETTER_SEND_START_FAILED,
      { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID, error: MOCK_ERROR },
    );
  });

  describe('when the worker does not start the run', () => {
    beforeEach(() => {
      enqueueMock.mockResolvedValue(false);
    });

    it('gives the claim back', async () => {
      await startNewsletterPostSend(FIRST_PUBLISH);

      expect(releaseNewsletterPostSendMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        MOCK_CLAIMED_AT,
      );
    });

    it('logs and resolves when giving the claim back fails', async () => {
      releaseNewsletterPostSendMock.mockRejectedValue(MOCK_ERROR);

      await expect(
        startNewsletterPostSend(FIRST_PUBLISH),
      ).resolves.toBeUndefined();

      expect(loggerErrorMock).toHaveBeenCalledWith(
        REVALIDATE_LOG.NEWSLETTER_SEND_RELEASE_FAILED,
        { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID, error: MOCK_ERROR },
      );
    });
  });
});
