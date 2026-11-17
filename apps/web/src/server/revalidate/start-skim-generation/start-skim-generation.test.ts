import { faker } from '@faker-js/faker';
import { SANITY_WEBHOOK_OPERATION } from '@shinefold/config/constants';
import { errorResult, okResult } from '@shinefold/utils';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { STARTER_DOCUMENT_ID_PREFIX } from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
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

const { getPostPublishedAtMock, envMock, afterWork } = vi.hoisted(() => ({
  getPostPublishedAtMock: vi.fn(),
  envMock: {} as { ANTHROPIC_API_KEY?: string },
  afterWork: [] as Promise<void>[],
}));

vi.mock('@shinefold/service', () => ({
  service: {
    entities: { posts: { v1: { getPostPublishedAt: getPostPublishedAtMock } } },
  },
}));

vi.mock('next/server', () => ({
  after: vi.fn((callback: () => Promise<void>) => {
    afterWork.push(callback());
  }),
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
    vi.mocked(resolveTenantById).mockResolvedValue(MOCK_TENANT);
    vi.mocked(toTenantSanityWriteContext).mockReturnValue(MOCK_WRITE_CONTEXT);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates after the response with the tenant's Sanity contexts", async () => {
    await start();

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

  it.each([
    ['dated in the future', MOCK_FUTURE_PUBLISHED_AT],
    ['without a publish date', null],
  ])('generates nothing for a post %s', async (_case, publishedAt) => {
    getPostPublishedAtMock.mockResolvedValue(okResult(publishedAt));

    await start();

    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it('logs a failed publish-date lookup and generates nothing', async () => {
    getPostPublishedAtMock.mockResolvedValue(errorResult(MOCK_ERROR));

    await start();

    expect(logger.error).toHaveBeenCalledWith(
      GENERATE_SKIM_LOG.PUBLISHED_AT_LOOKUP_FAILED,
      { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID, error: MOCK_ERROR },
    );
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it('generates nothing for a tenant that is no longer servable', async () => {
    vi.mocked(resolveTenantById).mockResolvedValue(undefined);

    await start();

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
