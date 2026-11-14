import { SANITY_WEBHOOK_OPERATION } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { enqueueWorkerRun } from '@web/server/revalidate/enqueue-worker-run/enqueue-worker-run';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  SCHEDULED_POST_PURGE_PATH,
  schedulePostPurge,
} from './schedule-post-purge';

const { getPostPublishedAtMock } = vi.hoisted(() => ({
  getPostPublishedAtMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: { posts: { v1: { getPostPublishedAt: getPostPublishedAtMock } } },
  },
}));

vi.mock('@web/server/revalidate/enqueue-worker-run/enqueue-worker-run', () => ({
  enqueueWorkerRun: vi.fn(),
}));

vi.mock('@blog/db', () => ({ queries: {} }));

faker.seed(7384);

const MOCK_NOW = faker.date.recent();
const MOCK_POST_ID = faker.string.uuid();
const MOCK_FUTURE_PUBLISHED_AT = faker.date
  .soon({ refDate: MOCK_NOW })
  .toISOString();
const MOCK_PAST_PUBLISHED_AT = faker.date
  .recent({ refDate: MOCK_NOW })
  .toISOString();
const MOCK_OTHER_TYPE = faker.string.alphanumeric(12);

const PUBLISH = {
  operation: SANITY_WEBHOOK_OPERATION.UPDATE,
  type: POST_TYPE,
  id: MOCK_POST_ID,
  tenantId: MOCK_TENANT_ID,
  tenant: MOCK_TENANT_SANITY_CONTEXT,
};

const enqueueMock = vi.mocked(enqueueWorkerRun);

describe(schedulePostPurge, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MOCK_NOW);
    getPostPublishedAtMock.mockResolvedValue(
      okResult(MOCK_FUTURE_PUBLISHED_AT),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([SANITY_WEBHOOK_OPERATION.CREATE, SANITY_WEBHOOK_OPERATION.UPDATE])(
    'enqueues one run for a post dated in the future on %s',
    async (operation) => {
      await schedulePostPurge({ ...PUBLISH, operation });

      expect(enqueueMock).toHaveBeenCalledOnce();
      expect(enqueueMock).toHaveBeenCalledWith({
        path: SCHEDULED_POST_PURGE_PATH,
        request: {
          tenantId: MOCK_TENANT_ID,
          postId: MOCK_POST_ID,
          publishedAt: MOCK_FUTURE_PUBLISHED_AT,
        },
        log: {
          SKIPPED: REVALIDATE_LOG.SCHEDULED_PURGE_ENQUEUE_SKIPPED,
          REFUSED: REVALIDATE_LOG.SCHEDULED_PURGE_ENQUEUE_REFUSED,
          FAILED: REVALIDATE_LOG.SCHEDULED_PURGE_ENQUEUE_FAILED,
        },
      });
    },
  );

  it('reads the date from the published post in its tenant', async () => {
    await schedulePostPurge(PUBLISH);

    expect(getPostPublishedAtMock).toHaveBeenCalledWith(
      MOCK_POST_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it.each([
    ['a date already passed', MOCK_PAST_PUBLISHED_AT],
    ['the current moment', MOCK_NOW.toISOString()],
    ['no date', undefined],
  ])('enqueues nothing for a post with %s', async (_label, publishedAt) => {
    getPostPublishedAtMock.mockResolvedValue(okResult(publishedAt));

    await schedulePostPurge(PUBLISH);

    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it.each([
    ['a delete', { operation: SANITY_WEBHOOK_OPERATION.DELETE }],
    ['another document type', { type: MOCK_OTHER_TYPE }],
    ['an unresolved tenant', { tenantId: undefined }],
    ['no tenant Sanity context', { tenant: undefined }],
  ])('reads and enqueues nothing for %s', async (_label, override) => {
    await schedulePostPurge({ ...PUBLISH, ...override });

    expect(getPostPublishedAtMock).not.toHaveBeenCalled();
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it('logs and enqueues nothing when the date cannot be read', async () => {
    getPostPublishedAtMock.mockResolvedValue(errorResult(MOCK_ERROR));

    await schedulePostPurge(PUBLISH);

    expect(enqueueMock).not.toHaveBeenCalled();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      REVALIDATE_LOG.SCHEDULED_POST_LOOKUP_FAILED,
      { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID, error: MOCK_ERROR },
    );
  });
});
