import { faker } from '@faker-js/faker';
import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config/constants';
import {
  buildEnqueueHeaders,
  ENQUEUE_MAX_AGE_MS,
} from '@shinefold/utils/enqueue-signature';
import { isUndefined } from '@shinefold/utils/primitives';
import { mockTenantSanityCredentials } from '@web/testing/server/tenant/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { z } from 'zod';

import {
  readSignedTenantRequest,
  type TSignedTenantRequestOptions,
} from './read-signed-tenant-request';

const { getTenantSanityCredentialsMock } = vi.hoisted(() => ({
  getTenantSanityCredentialsMock: vi.fn(),
}));

vi.mock('@shinefold/db', () => ({
  queries: {
    tenants: { getTenantSanityCredentials: getTenantSanityCredentialsMock },
  },
}));

faker.seed(7180);

const MOCK_NOW = faker.date.recent().getTime();
const MOCK_SECRET = faker.string.alphanumeric(24);
const MOCK_OTHER_SECRET = faker.string.alphanumeric(24);
const MOCK_PATH = `/api/${faker.lorem.slug()}`;
const MOCK_OTHER_PATH = `/api/${faker.lorem.slug()}`;
const MOCK_URL = `${faker.internet.url({ appendSlash: false })}${MOCK_PATH}`;
const MOCK_CREDENTIALS = mockTenantSanityCredentials();
const MOCK_LOG = {
  SECRET_MISSING: faker.lorem.slug(),
  TENANT_LOOKUP_FAILED: faker.lorem.slug(),
};
const MOCK_OPTIONS = { secret: MOCK_SECRET, log: MOCK_LOG };
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

const readStatus = async (
  request: Request,
  options: TSignedTenantRequestOptions = MOCK_OPTIONS,
) => {
  const result = await readSignedTenantRequest(request, bodySchema, options);
  return 'refusal' in result ? result.refusal.status : undefined;
};

describe(readSignedTenantRequest, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_NOW });
    getTenantSanityCredentialsMock.mockResolvedValue(MOCK_CREDENTIALS);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the parsed body and the tenant's credentials", async () => {
    expect(
      await readSignedTenantRequest(
        signedRequest(MOCK_RAW_BODY),
        bodySchema,
        MOCK_OPTIONS,
      ),
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
    expect(logger.error).toHaveBeenCalledWith(MOCK_LOG.TENANT_LOOKUP_FAILED, {
      tenantId: MOCK_TENANT_ID,
      error: MOCK_ERROR,
    });
  });

  it('logs and fails when the secret is not configured', async () => {
    expect(
      await readStatus(signedRequest(MOCK_RAW_BODY), {
        ...MOCK_OPTIONS,
        secret: undefined,
      }),
    ).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(MOCK_LOG.SECRET_MISSING);
  });
});
