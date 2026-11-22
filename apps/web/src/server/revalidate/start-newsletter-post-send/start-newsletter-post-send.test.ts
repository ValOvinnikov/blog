import { faker } from '@faker-js/faker';
import {
  ERROR_CODE,
  NEWSLETTER_SENDING_OFF_CAUSES,
  SANITY_WEBHOOK_OPERATION,
  STARTER_DOCUMENT_ID_PREFIX,
} from '@shinefold/config/constants';
import { errorResult, okResult } from '@shinefold/utils';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { enqueueNewsletterPostSend } from '@web/server/revalidate/enqueue-newsletter-post-send/enqueue-newsletter-post-send';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { startNewsletterPostSend } from './start-newsletter-post-send';

const {
  getNewsletterSendingOffCauseMock,
  claimNewsletterPostSendMock,
  markNewsletterPostSkippedMock,
  releaseNewsletterPostSendMock,
} = vi.hoisted(() => ({
  getNewsletterSendingOffCauseMock: vi.fn(),
  claimNewsletterPostSendMock: vi.fn(),
  markNewsletterPostSkippedMock: vi.fn(),
  releaseNewsletterPostSendMock: vi.fn(),
}));

vi.mock('@shinefold/db', () => ({
  queries: {
    newsletterPostSends: {
      getNewsletterSendingOffCause: getNewsletterSendingOffCauseMock,
      claimNewsletterPostSend: claimNewsletterPostSendMock,
      markNewsletterPostSkipped: markNewsletterPostSkippedMock,
      releaseNewsletterPostSend: releaseNewsletterPostSendMock,
    },
  },
}));

vi.mock(
  '@web/server/revalidate/enqueue-newsletter-post-send/enqueue-newsletter-post-send',
  () => ({ enqueueNewsletterPostSend: vi.fn() }),
);

faker.seed(7164);

const MOCK_POST_ID = faker.string.uuid();
const MOCK_STARTER_POST_ID = `${STARTER_DOCUMENT_ID_PREFIX}${faker.lorem.word()}`;
const MOCK_OTHER_TYPE = faker.string.alphanumeric(12);
const MOCK_CLAIMED_AT = faker.date.recent();
const [MOCK_OFF_CAUSE] = NEWSLETTER_SENDING_OFF_CAUSES;

const FIRST_PUBLISH = {
  operation: SANITY_WEBHOOK_OPERATION.CREATE,
  type: POST_TYPE,
  id: MOCK_POST_ID,
  tenantId: MOCK_TENANT_ID,
};

const enqueueMock = vi.mocked(enqueueNewsletterPostSend);
const loggerErrorMock = vi.mocked(logger.error);

describe(startNewsletterPostSend, () => {
  beforeEach(() => {
    getNewsletterSendingOffCauseMock.mockResolvedValue(okResult(undefined));
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
    expect(markNewsletterPostSkippedMock).not.toHaveBeenCalled();
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

  it('claims nothing for a site with no tenant row', async () => {
    getNewsletterSendingOffCauseMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await startNewsletterPostSend(FIRST_PUBLISH);

    expect(claimNewsletterPostSendMock).not.toHaveBeenCalled();
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it.each(NEWSLETTER_SENDING_OFF_CAUSES)(
    'keeps the claim, records %s as why it was not sent and starts nothing',
    async (cause) => {
      getNewsletterSendingOffCauseMock.mockResolvedValue(okResult(cause));

      await startNewsletterPostSend(FIRST_PUBLISH);

      expect(markNewsletterPostSkippedMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        cause,
      );
      expect(enqueueMock).not.toHaveBeenCalled();
      expect(releaseNewsletterPostSendMock).not.toHaveBeenCalled();
    },
  );

  it('records nothing for a post already claimed on a site not sending', async () => {
    getNewsletterSendingOffCauseMock.mockResolvedValue(
      okResult(MOCK_OFF_CAUSE),
    );
    claimNewsletterPostSendMock.mockResolvedValue(null);

    await startNewsletterPostSend(FIRST_PUBLISH);

    expect(markNewsletterPostSkippedMock).not.toHaveBeenCalled();
  });

  it('starts nothing for a post already claimed', async () => {
    claimNewsletterPostSendMock.mockResolvedValue(null);

    await startNewsletterPostSend(FIRST_PUBLISH);

    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'the claim fails',
      () => claimNewsletterPostSendMock.mockRejectedValue(MOCK_ERROR),
    ],
    [
      'recording why the post was not sent fails',
      () => {
        getNewsletterSendingOffCauseMock.mockResolvedValue(
          okResult(MOCK_OFF_CAUSE),
        );
        markNewsletterPostSkippedMock.mockRejectedValue(MOCK_ERROR);
      },
    ],
  ])('logs and resolves when %s', async (_label, arrange) => {
    arrange();

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
