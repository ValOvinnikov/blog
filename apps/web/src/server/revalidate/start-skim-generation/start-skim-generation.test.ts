import { faker } from '@faker-js/faker';
import {
  SANITY_WEBHOOK_OPERATION,
  STARTER_DOCUMENT_ID_PREFIX,
} from '@shinefold/config/constants';
import { errorResult, okResult } from '@shinefold/utils';
import {
  GENERATE_SKIM_LOG,
  SKIM_GO_LIVE_PATH,
} from '@web/constants/generate-skim';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { enqueueWorkerRun } from '@web/server/revalidate/enqueue-worker-run/enqueue-worker-run';
import { generatePostSkim } from '@web/server/skim/generate-post-skim/generate-post-skim';
import { resolveTenantById } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { toTenantSanityWriteContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { after } from 'next/server';

import { startSkimGeneration } from './start-skim-generation';

const { getPostPublishedAtMock, hasPostTakeawaysMock, envMock, afterWork } =
  vi.hoisted(() => ({
    getPostPublishedAtMock: vi.fn(),
    hasPostTakeawaysMock: vi.fn(),
    envMock: {} as { ANTHROPIC_API_KEY?: string },
    afterWork: [] as Promise<void>[],
  }));

vi.mock('@shinefold/service', () => ({
  service: {
    entities: { posts: { v1: { getPostPublishedAt: getPostPublishedAtMock } } },
    editorial: { skim: { v1: { hasPostTakeaways: hasPostTakeawaysMock } } },
  },
}));

vi.mock('next/server', () => ({
  after: vi.fn((callback: () => Promise<void>) => {
    afterWork.push(callback());
  }),
}));

vi.mock('@web/server/revalidate/enqueue-worker-run/enqueue-worker-run', () => ({
  enqueueWorkerRun: vi.fn(),
}));

vi.mock('@web/server/skim/generate-post-skim/generate-post-skim', () => ({
  generatePostSkim: vi.fn(),
}));

vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  resolveTenantById: vi.fn(),
}));

vi.mock(
  '@web/server/tenant/tenant-sanity-context/tenant-sanity-context',
  () => ({ toTenantSanityWriteContext: vi.fn() }),
);

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

vi.mock('@shinefold/db', () => ({ queries: {} }));

faker.seed(1027);

const MOCK_NOW = faker.date.recent();
const MOCK_POST_ID = faker.string.uuid();
const MOCK_API_KEY = faker.string.alphanumeric(16);
const MOCK_OTHER_TYPE = faker.string.alphanumeric(12);
const MOCK_PAST_PUBLISHED_AT = faker.date
  .recent({ refDate: MOCK_NOW })
  .toISOString();
const MOCK_FUTURE_PUBLISHED_AT = faker.date
  .soon({ refDate: MOCK_NOW })
  .toISOString();
const MOCK_TENANT = mockTenant();
const MOCK_WRITE_CONTEXT = {
  tenant: MOCK_TENANT_SANITY_CONTEXT,
  tenantId: MOCK_TENANT_ID,
  isActive: true,
};

const MOCK_FIRST_PUBLISH = {
  operation: SANITY_WEBHOOK_OPERATION.CREATE,
  type: POST_TYPE,
  id: MOCK_POST_ID,
  tenantId: MOCK_TENANT_ID,
  tenant: MOCK_TENANT_SANITY_CONTEXT,
};

const start = async (
  event: Parameters<typeof startSkimGeneration>[0] = MOCK_FIRST_PUBLISH,
): Promise<void> => {
  startSkimGeneration(event);
  await Promise.all(afterWork.splice(0));
};

describe(startSkimGeneration, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MOCK_NOW);
    envMock.ANTHROPIC_API_KEY = MOCK_API_KEY;
    getPostPublishedAtMock.mockResolvedValue(okResult(MOCK_PAST_PUBLISHED_AT));
    hasPostTakeawaysMock.mockResolvedValue(okResult(false));
    vi.mocked(resolveTenantById).mockResolvedValue(MOCK_TENANT);
    vi.mocked(toTenantSanityWriteContext).mockReturnValue(MOCK_WRITE_CONTEXT);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates after the response with the tenant's Sanity contexts", async () => {
    await start();

    expect(enqueueWorkerRun).not.toHaveBeenCalled();
    expect(after).toHaveBeenCalledOnce();
    expect(toTenantSanityWriteContext).toHaveBeenCalledWith(MOCK_TENANT);
    expect(generatePostSkim).toHaveBeenCalledWith({
      postId: MOCK_POST_ID,
      apiKey: MOCK_API_KEY,
      readTenant: MOCK_TENANT_SANITY_CONTEXT,
      writeContext: MOCK_WRITE_CONTEXT,
    });
  });

  it.each([
    ['an update', { operation: SANITY_WEBHOOK_OPERATION.UPDATE }],
    ['a delete', { operation: SANITY_WEBHOOK_OPERATION.DELETE }],
    ['another document type', { type: MOCK_OTHER_TYPE }],
    ['a starter post', { id: `${STARTER_DOCUMENT_ID_PREFIX}${MOCK_POST_ID}` }],
    ['no tenant', { tenantId: undefined }],
    ['no tenant Sanity context', { tenant: undefined }],
  ])('starts nothing for %s', async (_case, override) => {
    await start({ ...MOCK_FIRST_PUBLISH, ...override });

    expect(after).not.toHaveBeenCalled();
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it('starts nothing when no Anthropic key is configured', async () => {
    delete envMock.ANTHROPIC_API_KEY;

    await start();

    expect(after).not.toHaveBeenCalled();
  });

  it('generates nothing for a post without a publish date', async () => {
    getPostPublishedAtMock.mockResolvedValue(okResult(undefined));

    await start();

    expect(generatePostSkim).not.toHaveBeenCalled();
    expect(enqueueWorkerRun).not.toHaveBeenCalled();
  });

  it('hands a future-dated post to the worker for its go-live', async () => {
    getPostPublishedAtMock.mockResolvedValue(
      okResult(MOCK_FUTURE_PUBLISHED_AT),
    );

    await start();

    expect(generatePostSkim).not.toHaveBeenCalled();
    expect(enqueueWorkerRun).toHaveBeenCalledWith({
      path: SKIM_GO_LIVE_PATH,
      request: {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        publishedAt: MOCK_FUTURE_PUBLISHED_AT,
      },
      log: {
        SKIPPED: GENERATE_SKIM_LOG.GO_LIVE_ENQUEUE_SKIPPED,
        REFUSED: GENERATE_SKIM_LOG.GO_LIVE_ENQUEUE_REFUSED,
        FAILED: GENERATE_SKIM_LOG.GO_LIVE_ENQUEUE_FAILED,
      },
    });
  });

  it.each([
    [
      'publish-date',
      getPostPublishedAtMock,
      GENERATE_SKIM_LOG.PUBLISHED_AT_LOOKUP_FAILED,
    ],
    [
      'takeaways',
      hasPostTakeawaysMock,
      GENERATE_SKIM_LOG.TAKEAWAYS_LOOKUP_FAILED,
    ],
  ])(
    'logs a failed %s lookup and generates nothing',
    async (_lookup, lookupMock, event) => {
      lookupMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await start();

      expect(logger.error).toHaveBeenCalledWith(event, {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        error: MOCK_ERROR,
      });
      expect(generatePostSkim).not.toHaveBeenCalled();
    },
  );

  it('logs and generates nothing for a tenant that is no longer servable', async () => {
    vi.mocked(resolveTenantById).mockResolvedValue(undefined);

    await start();

    expect(logger.warn).toHaveBeenCalledWith(
      GENERATE_SKIM_LOG.TENANT_NOT_SERVABLE,
      { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID },
    );
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it('spends nothing on a republished post that already has takeaways', async () => {
    hasPostTakeawaysMock.mockResolvedValue(okResult(true));

    await start();

    expect(hasPostTakeawaysMock).toHaveBeenCalledWith(
      MOCK_POST_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it('logs a generation that throws and settles the after() work', async () => {
    vi.mocked(generatePostSkim).mockRejectedValue(MOCK_ERROR);

    await expect(start()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      GENERATE_SKIM_LOG.PUBLISH_START_FAILED,
      { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID, error: MOCK_ERROR },
    );
  });
});
