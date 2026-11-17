import { faker } from '@faker-js/faker';
import { HTTP_STATUS } from '@shinefold/config/constants';
import { errorResult, okResult } from '@shinefold/utils';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { generatePostSkim } from '@web/server/skim/generate-post-skim/generate-post-skim';
import { resolveTenantById } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { toTenantSanityWriteContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { mockSignedRequest } from '@web/testing/server/signed-request/fixtures';
import { mockTenantSanityCredentials } from '@web/testing/server/tenant/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { POST } from './route';

const {
  getTenantSanityCredentialsMock,
  getPostPublishedAtMock,
  hasPostTakeawaysMock,
  envMock,
} = vi.hoisted(() => ({
  getTenantSanityCredentialsMock: vi.fn(),
  getPostPublishedAtMock: vi.fn(),
  hasPostTakeawaysMock: vi.fn(),
  envMock: {} as {
    SANITY_REVALIDATE_SECRET?: string;
    ANTHROPIC_API_KEY?: string;
  },
}));

vi.mock('@shinefold/db', () => ({
  queries: {
    tenants: { getTenantSanityCredentials: getTenantSanityCredentialsMock },
  },
}));

vi.mock('@shinefold/service', () => ({
  service: {
    entities: { posts: { v1: { getPostPublishedAt: getPostPublishedAtMock } } },
    editorial: { skim: { v1: { hasPostTakeaways: hasPostTakeawaysMock } } },
  },
}));

vi.mock('@web/server/skim/generate-post-skim/generate-post-skim');
vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant');
vi.mock('@web/server/tenant/tenant-sanity-context/tenant-sanity-context');
vi.mock('@web/utils/env/env', () => ({ env: envMock }));

faker.seed(10272);

const MOCK_PATH = '/api/generate-skim/scheduled';
const MOCK_URL = `${faker.internet.url({ appendSlash: false })}${MOCK_PATH}`;
const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_API_KEY = faker.string.alphanumeric(16);
const MOCK_NOW = faker.date.recent();
const MOCK_POST_ID = faker.string.uuid();
const MOCK_GO_LIVE_AT = faker.date.recent({ refDate: MOCK_NOW }).toISOString();
const MOCK_MOVED_GO_LIVE_AT = faker.date
  .soon({ refDate: MOCK_NOW })
  .toISOString();
const MOCK_TAKEAWAY_COUNT = faker.number.int({ min: 3, max: 7 });
const MOCK_REFUSAL_MESSAGE = faker.lorem.sentence();
const MOCK_CREDENTIALS = mockTenantSanityCredentials();
const MOCK_TENANT = mockTenant();
const MOCK_WRITE_CONTEXT = {
  tenant: MOCK_TENANT_SANITY_CONTEXT,
  tenantId: MOCK_TENANT_ID,
  isActive: true,
};
const MOCK_BODY = {
  tenantId: MOCK_TENANT_ID,
  postId: MOCK_POST_ID,
  publishedAt: MOCK_GO_LIVE_AT,
};

const goLive = (body: unknown = MOCK_BODY, secret = MOCK_SECRET) =>
  POST(
    mockSignedRequest({ url: MOCK_URL, secret, rawBody: JSON.stringify(body) }),
  );

describe(POST, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MOCK_NOW);
    envMock.SANITY_REVALIDATE_SECRET = MOCK_SECRET;
    envMock.ANTHROPIC_API_KEY = MOCK_API_KEY;
    getTenantSanityCredentialsMock.mockResolvedValue(MOCK_CREDENTIALS);
    getPostPublishedAtMock.mockResolvedValue(okResult(MOCK_GO_LIVE_AT));
    hasPostTakeawaysMock.mockResolvedValue(okResult(false));
    vi.mocked(resolveTenantById).mockResolvedValue(MOCK_TENANT);
    vi.mocked(toTenantSanityWriteContext).mockReturnValue(MOCK_WRITE_CONTEXT);
    vi.mocked(generatePostSkim).mockResolvedValue({
      isGenerated: true,
      count: MOCK_TAKEAWAY_COUNT,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates a post going live now with the signed tenant's contexts", async () => {
    const response = await goLive();

    expect(response.status).toBe(HTTP_STATUS.OK);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      count: MOCK_TAKEAWAY_COUNT,
    });
    expect(resolveTenantById).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(hasPostTakeawaysMock).toHaveBeenCalledWith(
      MOCK_POST_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
    expect(generatePostSkim).toHaveBeenCalledWith({
      postId: MOCK_POST_ID,
      apiKey: MOCK_API_KEY,
      readTenant: MOCK_CREDENTIALS,
      writeContext: MOCK_WRITE_CONTEXT,
    });
  });

  it('makes a retried call after the draft was saved a no-op', async () => {
    await goLive();
    hasPostTakeawaysMock.mockResolvedValue(okResult(true));

    const retry = await goLive();

    expect(retry.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(generatePostSkim).toHaveBeenCalledOnce();
  });

  it('never overwrites takeaways the post already has', async () => {
    hasPostTakeawaysMock.mockResolvedValue(okResult(true));

    const response = await goLive();

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it('refuses an unsigned call before reading anything', async () => {
    const response = await goLive(MOCK_BODY, faker.string.alphanumeric(32));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(getPostPublishedAtMock).not.toHaveBeenCalled();
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it('logs and answers 503 when no Anthropic key is configured', async () => {
    delete envMock.ANTHROPIC_API_KEY;

    const response = await goLive();

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(logger.error).toHaveBeenCalledWith(
      GENERATE_SKIM_LOG.CONFIG_MISSING,
      { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID },
    );
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it.each([
    ['its date has moved', MOCK_MOVED_GO_LIVE_AT],
    ['it has no publish date', undefined],
  ])('does nothing for a post when %s', async (_case, currentPublishedAt) => {
    getPostPublishedAtMock.mockResolvedValue(okResult(currentPublishedAt));

    const response = await goLive();

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it('does nothing for a signed date still ahead', async () => {
    getPostPublishedAtMock.mockResolvedValue(okResult(MOCK_MOVED_GO_LIVE_AT));

    const response = await goLive({
      ...MOCK_BODY,
      publishedAt: MOCK_MOVED_GO_LIVE_AT,
    });

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it.each([
    [
      'publish date',
      getPostPublishedAtMock,
      GENERATE_SKIM_LOG.PUBLISHED_AT_LOOKUP_FAILED,
    ],
    [
      'existing takeaways',
      hasPostTakeawaysMock,
      GENERATE_SKIM_LOG.TAKEAWAYS_LOOKUP_FAILED,
    ],
  ])(
    'logs and answers 500 when the %s read fails',
    async (_case, lookupMock, event) => {
      lookupMock.mockResolvedValue(errorResult(MOCK_ERROR));

      const response = await goLive();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(logger.error).toHaveBeenCalledWith(event, {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        error: MOCK_ERROR,
      });
      expect(generatePostSkim).not.toHaveBeenCalled();
    },
  );

  it('answers 404 for a tenant that is no longer servable', async () => {
    vi.mocked(resolveTenantById).mockResolvedValue(undefined);

    const response = await goLive();

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(generatePostSkim).not.toHaveBeenCalled();
  });

  it('leaves a tenant without write credentials to the write gate', async () => {
    vi.mocked(toTenantSanityWriteContext).mockReturnValue({
      ...MOCK_WRITE_CONTEXT,
      tenant: undefined,
    });

    await goLive();

    expect(hasPostTakeawaysMock).not.toHaveBeenCalled();
    expect(generatePostSkim).toHaveBeenCalledOnce();
  });

  it("relays the pipeline's refusal", async () => {
    vi.mocked(generatePostSkim).mockResolvedValue({
      isGenerated: false,
      message: MOCK_REFUSAL_MESSAGE,
      status: HTTP_STATUS.FORBIDDEN,
    });

    const response = await goLive();

    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    await expect(response.json()).resolves.toEqual({
      message: MOCK_REFUSAL_MESSAGE,
    });
  });
});
