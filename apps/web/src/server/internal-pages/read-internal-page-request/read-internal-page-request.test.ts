import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import {
  buildEnqueueHeaders,
  ENQUEUE_MAX_AGE_MS,
} from '@blog/utils/enqueue-signature';
import { isUndefined } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import { INTERNAL_PAGES_LOG } from '@web/constants/internal-pages';
import { mockTenantSanityCredentials } from '@web/testing/server/tenant/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { z } from 'zod';

import { readInternalPageRequest } from './read-internal-page-request';

const { getTenantSanityCredentialsMock, envMock } = vi.hoisted(() => ({
  getTenantSanityCredentialsMock: vi.fn(),
  envMock: {} as { INTERNAL_PAGES_SECRET?: string },
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantSanityCredentials: getTenantSanityCredentialsMock },
  },
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

faker.seed(7180);

const MOCK_NOW = faker.date.recent().getTime();
const MOCK_SECRET = faker.string.alphanumeric(24);
const MOCK_OTHER_SECRET = faker.string.alphanumeric(24);
const MOCK_PATH = `/api/internal/pages/${faker.lorem.slug()}`;
const MOCK_OTHER_PATH = `/api/internal/pages/${faker.lorem.slug()}`;
const MOCK_URL = `${faker.internet.url({ appendSlash: false })}${MOCK_PATH}`;
const MOCK_CREDENTIALS = mockTenantSanityCredentials();
const MOCK_BODY = { tenantId: MOCK_TENANT_ID };
const MOCK_RAW_BODY = JSON.stringify(MOCK_BODY);

const bodySchema = z.object({ tenantId: z.uuid() });

const signedRequest = (
  rawBody: string,
  options: { secret?: string; now?: number; path?: string } = {},
): Request => {
  const { secret = MOCK_SECRET, now, path = MOCK_PATH } = options;
  return new Request(MOCK_URL, {
    method: HTTP_METHOD.POST,
    headers: buildEnqueueHeaders({
      secret,
      path,
      rawBody,
      ...(isUndefined(now) ? {} : { now }),
    }),
    body: rawBody,
  });
};

const readStatus = async (request: Request) => {
  const result = await readInternalPageRequest(request, bodySchema);
  return 'refusal' in result ? result.refusal.status : undefined;
};

describe(readInternalPageRequest, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_NOW });
    envMock.INTERNAL_PAGES_SECRET = MOCK_SECRET;
    getTenantSanityCredentialsMock.mockResolvedValue(MOCK_CREDENTIALS);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the parsed body and the tenant's credentials", async () => {
    expect(
      await readInternalPageRequest(signedRequest(MOCK_RAW_BODY), bodySchema),
    ).toEqual({ body: MOCK_BODY, tenant: MOCK_CREDENTIALS });
    expect(getTenantSanityCredentialsMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
    );
  });

  it.each([
    [
      'unsigned',
      () =>
        new Request(MOCK_URL, {
          method: HTTP_METHOD.POST,
          body: MOCK_RAW_BODY,
        }),
    ],
    [
      'signed with another secret',
      () => signedRequest(MOCK_RAW_BODY, { secret: MOCK_OTHER_SECRET }),
    ],
    [
      'changed after signing',
      () =>
        new Request(MOCK_URL, {
          method: HTTP_METHOD.POST,
          headers: signedRequest(MOCK_RAW_BODY).headers,
          body: JSON.stringify({ tenantId: faker.string.uuid() }),
        }),
    ],
    [
      'signed for another path',
      () => signedRequest(MOCK_RAW_BODY, { path: MOCK_OTHER_PATH }),
    ],
    [
      'expired',
      () =>
        signedRequest(MOCK_RAW_BODY, {
          now: MOCK_NOW - ENQUEUE_MAX_AGE_MS - 1,
        }),
    ],
  ])('refuses a request that is %s', async (_case, createRequest) => {
    expect(await readStatus(createRequest())).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(getTenantSanityCredentialsMock).not.toHaveBeenCalled();
  });

  it.each([
    ['a tenant id that is not a uuid', JSON.stringify({ tenantId: 'x' })],
    ['a body that is not JSON', 'not json'],
  ])('rejects %s', async (_case, rawBody) => {
    expect(await readStatus(signedRequest(rawBody))).toBe(
      HTTP_STATUS.BAD_REQUEST,
    );
  });

  it('answers not found for an unknown tenant', async () => {
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);

    expect(await readStatus(signedRequest(MOCK_RAW_BODY))).toBe(
      HTTP_STATUS.NOT_FOUND,
    );
  });

  it('logs and fails when the tenant lookup throws', async () => {
    getTenantSanityCredentialsMock.mockRejectedValue(MOCK_ERROR);

    expect(await readStatus(signedRequest(MOCK_RAW_BODY))).toBe(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
    expect(logger.error).toHaveBeenCalledWith(
      INTERNAL_PAGES_LOG.TENANT_LOOKUP_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
    );
  });

  it('logs and fails when the secret is not configured', async () => {
    envMock.INTERNAL_PAGES_SECRET = undefined;

    expect(await readStatus(signedRequest(MOCK_RAW_BODY))).toBe(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
    expect(logger.error).toHaveBeenCalledWith(
      INTERNAL_PAGES_LOG.SECRET_MISSING,
    );
  });
});
