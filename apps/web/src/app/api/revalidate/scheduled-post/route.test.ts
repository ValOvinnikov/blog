import { faker } from '@faker-js/faker';
import {
  HTTP_METHOD,
  HTTP_STATUS,
  SANITY_WEBHOOK_OPERATION,
} from '@shinefold/config/constants';
import { okResult } from '@shinefold/utils';
import { buildEnqueueHeaders } from '@shinefold/utils/enqueue-signature';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import type * as DeriveRevalidatePathsModule from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { mockTenantSanityCredentials } from '@web/testing/server/tenant/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { getRevalidateTagsForType } from '@web/utils/revalidate-tags';

import { POST } from './route';

const {
  getTenantSanityCredentialsMock,
  deriveRevalidatePathsMock,
  revalidateTagMock,
  revalidatePathMock,
  resolveReferencingModuleTagsMock,
  envMock,
} = vi.hoisted(() => ({
  getTenantSanityCredentialsMock: vi.fn(),
  deriveRevalidatePathsMock: vi.fn(),
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  resolveReferencingModuleTagsMock: vi.fn(),
  envMock: {} as { SANITY_REVALIDATE_SECRET?: string },
}));

vi.mock('@shinefold/db', () => ({
  queries: {
    tenants: { getTenantSanityCredentials: getTenantSanityCredentialsMock },
  },
}));

vi.mock(
  '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths',
  async (importActual) => ({
    ...(await importActual<typeof DeriveRevalidatePathsModule>()),
    deriveRevalidatePaths: deriveRevalidatePathsMock,
  }),
);

vi.mock(
  '@web/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags',
  () => ({ resolveReferencingModuleTags: resolveReferencingModuleTagsMock }),
);

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

faker.seed(7385);

const MOCK_PATH = '/api/revalidate/scheduled-post';
const MOCK_URL = `${faker.internet.url({ appendSlash: false })}${MOCK_PATH}`;
const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_POST_ID = faker.string.uuid();
const MOCK_POST_PATH = `/${MOCK_TENANT_ID}/${faker.lorem.slug()}`;
const MOCK_CREDENTIALS = mockTenantSanityCredentials();
const MOCK_BODY = { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID };

const POST_TAGS = getRevalidateTagsForType(POST_TYPE, MOCK_POST_ID);

const signedRequest = (body: unknown): Request => {
  const rawBody = JSON.stringify(body);
  return new Request(MOCK_URL, {
    method: HTTP_METHOD.POST,
    headers: buildEnqueueHeaders({
      secret: MOCK_SECRET,
      path: MOCK_PATH,
      rawBody,
    }),
    body: rawBody,
  });
};

describe(POST, () => {
  beforeEach(() => {
    envMock.SANITY_REVALIDATE_SECRET = MOCK_SECRET;
    getTenantSanityCredentialsMock.mockResolvedValue(MOCK_CREDENTIALS);
    deriveRevalidatePathsMock.mockResolvedValue(okResult([MOCK_POST_PATH]));
    resolveReferencingModuleTagsMock.mockResolvedValue([]);
  });

  it("purges the post's tenant-scoped tags and derived paths", async () => {
    const response = await POST(signedRequest(MOCK_BODY));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(revalidateTagMock.mock.calls.map(([tag]) => tag)).toEqual([
      ...POST_TAGS,
      ...POST_TAGS.map((tag) => `t:${MOCK_CREDENTIALS.projectId}:${tag}`),
    ]);
    expect(revalidatePathMock.mock.calls).toEqual([[MOCK_POST_PATH]]);
  });

  it('resolves the post within the signed tenant only', async () => {
    await POST(signedRequest(MOCK_BODY));

    expect(getTenantSanityCredentialsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(deriveRevalidatePathsMock).toHaveBeenCalledWith({
      type: POST_TYPE,
      id: MOCK_POST_ID,
      slug: undefined,
      operation: SANITY_WEBHOOK_OPERATION.UPDATE,
      tenantId: MOCK_TENANT_ID,
      tenant: MOCK_CREDENTIALS,
    });
  });

  it('logs and fails when the tenant lookup throws', async () => {
    getTenantSanityCredentialsMock.mockRejectedValue(MOCK_ERROR);

    const response = await POST(signedRequest(MOCK_BODY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      REVALIDATE_LOG.SCHEDULED_PURGE_TENANT_LOOKUP_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
    );
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('logs and fails when the revalidate secret is not configured', async () => {
    envMock.SANITY_REVALIDATE_SECRET = undefined;

    const response = await POST(signedRequest(MOCK_BODY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      REVALIDATE_LOG.SECRET_MISSING,
    );
  });
});
