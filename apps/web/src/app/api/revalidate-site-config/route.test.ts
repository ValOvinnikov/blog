import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import {
  buildSettingsFeaturesCacheTag,
  buildSiteConfigCacheTag,
  buildTenantPlanCacheTag,
} from '@web/utils/tenant-cache-tags';

import { POST } from './route';

faker.seed(8147);

const { revalidateTagMock, revalidatePathMock, listTenantsMock, envMock } =
  vi.hoisted(() => ({
    revalidateTagMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    listTenantsMock: vi.fn(),
    envMock: {} as { SITE_CONFIG_REVALIDATE_SECRET?: string },
  }));

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { listTenants: listTenantsMock },
  },
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

const AUTHORIZATION_HEADER = 'authorization';
const WHOLE_SITE_PURGE_EVENT = 'revalidate_site_config.whole_site_purge';
const MOCK_REVALIDATE_URL = faker.internet.url();
const MOCK_REVALIDATE_SECRET = faker.string.alphanumeric(32);
const MOCK_WRONG_SECRET = faker.string.alphanumeric(32);
const BEARER_SECRET = `Bearer ${MOCK_REVALIDATE_SECRET}`;
const MALFORMED_JSON_BODY = faker.lorem.word();

const tagsForTenant = (tenantId: string): string[] => [
  buildSiteConfigCacheTag(tenantId),
  buildSettingsFeaturesCacheTag(tenantId),
  buildTenantPlanCacheTag(tenantId),
];

const purgedTags = (): unknown[] =>
  revalidateTagMock.mock.calls.map(([tag]) => tag);

const makeRequest = (authorization?: string, body?: string): Request => {
  const headers = new Headers();
  if (authorization !== undefined) {
    headers.set(AUTHORIZATION_HEADER, authorization);
  }
  return new Request(MOCK_REVALIDATE_URL, {
    method: HTTP_METHOD.POST,
    headers,
    body,
  });
};

describe(POST, () => {
  beforeEach(() => {
    envMock.SITE_CONFIG_REVALIDATE_SECRET = MOCK_REVALIDATE_SECRET;
    revalidateTagMock.mockReset();
    revalidatePathMock.mockReset();
    listTenantsMock.mockReset();
    listTenantsMock.mockResolvedValue([
      mockTenant({ id: MOCK_TENANT_ID }),
      mockTenant({ id: MOCK_OTHER_TENANT_ID }),
    ]);
    vi.mocked(logger.warn).mockReset();
  });

  it('revalidates only the given tenant’s scoped tags when a tenantId is given', async () => {
    const request = makeRequest(
      BEARER_SECRET,
      JSON.stringify({ tenantId: MOCK_TENANT_ID }),
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(json).toEqual({
      revalidated: tagsForTenant(MOCK_TENANT_ID),
      pathPurged: true,
    });
    expect(revalidateTagMock.mock.calls).toEqual(
      tagsForTenant(MOCK_TENANT_ID).map((tag) => [tag, { expire: 0 }]),
    );
    expect(listTenantsMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(logger.warn).toHaveBeenCalledWith(WHOLE_SITE_PURGE_EVENT, {
      tenantIds: [MOCK_TENANT_ID],
      requestedTenantId: MOCK_TENANT_ID,
    });
  });

  it.each([
    { case: 'no body is sent', body: undefined },
    {
      case: 'tenantId is an empty string',
      body: JSON.stringify({ tenantId: '' }),
    },
    { case: 'the body is malformed JSON', body: MALFORMED_JSON_BODY },
  ])('revalidates every tenant’s scoped tags when $case', async ({ body }) => {
    const request = makeRequest(BEARER_SECRET, body);
    const response = await POST(request);
    const json = await response.json();

    const expectedTags = [
      ...tagsForTenant(MOCK_TENANT_ID),
      ...tagsForTenant(MOCK_OTHER_TENANT_ID),
    ];

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(json).toEqual({ revalidated: expectedTags, pathPurged: true });
    expect(purgedTags()).toEqual(expectedTags);
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(logger.warn).toHaveBeenCalledWith(WHOLE_SITE_PURGE_EVENT, {
      tenantIds: [MOCK_TENANT_ID, MOCK_OTHER_TENANT_ID],
      requestedTenantId: undefined,
    });
  });

  it.each([
    {
      case: 'the secret is wrong',
      authorization: `Bearer ${MOCK_WRONG_SECRET}`,
    },
    { case: 'the authorization header is missing', authorization: undefined },
    {
      case: 'the header is not a bearer token',
      authorization: MOCK_REVALIDATE_SECRET,
    },
  ])(
    'refuses and revalidates nothing when $case',
    async ({ authorization }) => {
      const request = makeRequest(authorization);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(revalidateTagMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
    },
  );

  it('fails and revalidates nothing when the secret is not configured', async () => {
    delete envMock.SITE_CONFIG_REVALIDATE_SECRET;

    const request = makeRequest(BEARER_SECRET);
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
