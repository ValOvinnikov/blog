import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { logger } from '@web/utils/logger/logger';

import { SANITY_OPERATION_HEADER, SANITY_PROJECT_ID_HEADER } from './route';

const { isValidSignatureMock } = vi.hoisted(() => ({
  isValidSignatureMock: vi.fn(),
}));

const { revalidateTagMock, revalidatePathMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

const {
  getTenantIdBySanityProjectIdMock,
  getTenantByIdMock,
  getTenantSanityCredentialsMock,
  removeBookmarksForPostMock,
} = vi.hoisted(() => ({
  getTenantIdBySanityProjectIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getTenantSanityCredentialsMock: vi.fn(),
  removeBookmarksForPostMock: vi.fn(),
}));

const { isDerivableRevalidateTypeMock, deriveRevalidatePathsMock } = vi.hoisted(
  () => ({
    isDerivableRevalidateTypeMock: vi.fn(),
    deriveRevalidatePathsMock: vi.fn(),
  }),
);

vi.mock('@sanity/webhook', () => ({
  isValidSignature: isValidSignatureMock,
  SIGNATURE_HEADER_NAME: 'sanity-webhook-signature',
}));

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

const { envMock } = vi.hoisted(() => ({
  envMock: {} as { SANITY_REVALIDATE_SECRET?: string },
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantIdBySanityProjectId: getTenantIdBySanityProjectIdMock,
      getTenantById: getTenantByIdMock,
      getTenantSanityCredentials: getTenantSanityCredentialsMock,
    },
    bookmarks: {
      removeBookmarksForPost: removeBookmarksForPostMock,
    },
  },
}));

vi.mock(
  '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths',
  () => ({
    POST_TYPE: 'page_post',
    isDerivableRevalidateType: isDerivableRevalidateTypeMock,
    deriveRevalidatePaths: deriveRevalidatePathsMock,
  }),
);

const { resolveReferencingModuleTagsMock } = vi.hoisted(() => ({
  resolveReferencingModuleTagsMock: vi.fn(),
}));

vi.mock(
  '@web/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags',
  () => ({
    resolveReferencingModuleTags: resolveReferencingModuleTagsMock,
  }),
);

const { recordTenantActivityMock } = vi.hoisted(() => ({
  recordTenantActivityMock: vi.fn(),
}));

vi.mock(
  '@web/server/revalidate/record-tenant-activity/record-tenant-activity',
  () => ({
    recordTenantActivity: recordTenantActivityMock,
  }),
);

vi.mock('@web/utils/logger/logger');

let loggerErrorMock = vi.mocked(logger.error);
let loggerWarnMock = vi.mocked(logger.warn);

const POST_ID = 'post-1';
const REVALIDATE_URL = 'https://example.com/api/revalidate';
const VALID_SIGNATURE = 't=1,v=valid-signature';
const INVALID_SIGNATURE = 't=1,v=invalid-signature';
const TENANT_ID = 'tenant-uuid-1';
const TENANT_PROJECT_ID = 'tenant-a-project';
const CONNECTION_ERROR_MESSAGE = 'connection terminated';
const TENANT_LOOKUP_FAILED_MESSAGE = 'Tenant lookup failed.';
const TENANT_HOME_PATH = '/tenant-uuid-1/EN';
const TENANT_POST_PATH = '/tenant-uuid-1/EN/blog/my-post';
const PATH_PURGE_FALLBACK_EVENT = 'revalidate.path_purge_fallback';
const HERO_MODULE_TAG = 'module:hero-1';
const CTA_MODULE_TAG = 'module:cta-2';

const makeRequest = (
  body: unknown,
  signature?: string,
  extraHeaders?: Record<string, string>,
): Request => {
  const headers = new Headers(extraHeaders);
  if (signature !== undefined) {
    headers.set(SIGNATURE_HEADER_NAME, signature);
  }
  return new Request(REVALIDATE_URL, {
    method: HTTP_METHOD.POST,
    headers,
    body: JSON.stringify(body),
  });
};

describe('POST /api/revalidate', () => {
  beforeEach(async () => {
    const fresh = await import('@web/utils/logger/logger');
    loggerErrorMock = vi.mocked(fresh.logger.error);
    loggerWarnMock = vi.mocked(fresh.logger.warn);
    envMock.SANITY_REVALIDATE_SECRET = 'test-secret';
    isValidSignatureMock.mockReset();
    revalidateTagMock.mockReset();
    revalidatePathMock.mockReset();
    getTenantIdBySanityProjectIdMock.mockReset();
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue({ id: TENANT_ID });
    getTenantSanityCredentialsMock.mockReset();
    removeBookmarksForPostMock.mockReset();
    isDerivableRevalidateTypeMock.mockReset();
    isDerivableRevalidateTypeMock.mockReturnValue(false);
    deriveRevalidatePathsMock.mockReset();
    resolveReferencingModuleTagsMock.mockReset();
    resolveReferencingModuleTagsMock.mockResolvedValue([]);
    recordTenantActivityMock.mockReset();
    recordTenantActivityMock.mockResolvedValue(undefined);
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('with the webhook secret configured', () => {
    let POST: typeof import('./route').POST;

    beforeEach(async () => {
      isValidSignatureMock.mockResolvedValue(true);
      ({ POST } = await import('./route'));
    });

    it('revalidates page_post, posts, author, topic and tag tags for a page_post webhook', async () => {
      const request = makeRequest(
        { _type: 'page_post', _id: POST_ID },
        VALID_SIGNATURE,
      );
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json).toEqual({
        revalidated: ['page_post', 'posts', 'author', 'topic', 'tag'],
        pathPurged: true,
        type: 'page_post',
        id: POST_ID,
        bookmarksRemoved: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledWith('page_post', {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledWith('posts', { expire: 0 });
      expect(revalidateTagMock).toHaveBeenCalledWith('author', { expire: 0 });
      expect(revalidateTagMock).toHaveBeenCalledWith('topic', { expire: 0 });
      expect(revalidateTagMock).toHaveBeenCalledWith('tag', { expire: 0 });
      expect(revalidateTagMock).toHaveBeenCalledTimes(5);
      expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
      expect(revalidatePathMock).toHaveBeenCalledTimes(1);
    });

    it('revalidates the legacy and tenant-scoped tags when sanity-project-id is present', async () => {
      const request = makeRequest(
        { _type: 'page_post', _id: POST_ID },
        VALID_SIGNATURE,
        { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
      );
      await POST(request);

      expect(revalidateTagMock).toHaveBeenCalledWith('page_post', {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledWith(
        `t:${TENANT_PROJECT_ID}:page_post`,
        { expire: 0 },
      );
      expect(revalidateTagMock).toHaveBeenCalledWith('posts', { expire: 0 });
      expect(revalidateTagMock).toHaveBeenCalledWith(
        `t:${TENANT_PROJECT_ID}:posts`,
        {
          expire: 0,
        },
      );
      expect(revalidateTagMock).toHaveBeenCalledWith('author', { expire: 0 });
      expect(revalidateTagMock).toHaveBeenCalledWith(
        `t:${TENANT_PROJECT_ID}:author`,
        { expire: 0 },
      );
      expect(revalidateTagMock).toHaveBeenCalledWith('topic', { expire: 0 });
      expect(revalidateTagMock).toHaveBeenCalledWith(
        `t:${TENANT_PROJECT_ID}:topic`,
        {
          expire: 0,
        },
      );
      expect(revalidateTagMock).toHaveBeenCalledWith('tag', { expire: 0 });
      expect(revalidateTagMock).toHaveBeenCalledWith(
        `t:${TENANT_PROJECT_ID}:tag`,
        {
          expire: 0,
        },
      );
      expect(revalidateTagMock).toHaveBeenCalledTimes(10);
    });

    it('revalidates only the legacy tags when sanity-project-id is absent', async () => {
      const request = makeRequest(
        { _type: 'page_post', _id: POST_ID },
        VALID_SIGNATURE,
      );
      await POST(request);

      expect(revalidateTagMock).toHaveBeenCalledWith('page_post', {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledTimes(5);
      expect(revalidateTagMock).not.toHaveBeenCalledWith(
        expect.stringMatching(/^t:/),
        expect.anything(),
      );
    });

    describe('tenant activity', () => {
      it("records the publishing tenant's activity", async () => {
        getTenantIdBySanityProjectIdMock.mockResolvedValue(TENANT_ID);
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        const response = await POST(request);

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(recordTenantActivityMock).toHaveBeenCalledWith(
          TENANT_ID,
          expect.any(Date),
        );
      });

      it('records no activity for an archived tenant', async () => {
        getTenantIdBySanityProjectIdMock.mockResolvedValue(TENANT_ID);
        getTenantByIdMock.mockResolvedValue(undefined);
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        await POST(request);

        expect(recordTenantActivityMock).not.toHaveBeenCalled();
      });

      it('records no activity when no tenant is resolved', async () => {
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
        );
        await POST(request);

        expect(recordTenantActivityMock).not.toHaveBeenCalled();
      });
    });

    describe('archived tenant', () => {
      it('ignores the event and revalidates nothing when the resolved tenant is archived', async () => {
        getTenantIdBySanityProjectIdMock.mockResolvedValue(TENANT_ID);
        getTenantByIdMock.mockResolvedValue(undefined);
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(json).toEqual({ message: 'Tenant is archived; event ignored.' });
        expect(revalidateTagMock).not.toHaveBeenCalled();
        expect(revalidatePathMock).not.toHaveBeenCalled();
      });

      it('still revalidates when no sanity-project-id is present at all', async () => {
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
        );
        const response = await POST(request);

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(getTenantByIdMock).not.toHaveBeenCalled();
        expect(revalidateTagMock).toHaveBeenCalledTimes(5);
      });
    });

    describe('tenant lookup failures', () => {
      it('returns non-2xx and revalidates nothing when the project-id lookup throws', async () => {
        getTenantIdBySanityProjectIdMock.mockRejectedValue(
          new Error(CONNECTION_ERROR_MESSAGE),
        );
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(502);
        expect(response.status).not.toBe(HTTP_STATUS.OK);
        expect(json).toEqual({ message: TENANT_LOOKUP_FAILED_MESSAGE });
        expect(getTenantByIdMock).not.toHaveBeenCalled();
        expect(revalidateTagMock).not.toHaveBeenCalled();
        expect(revalidatePathMock).not.toHaveBeenCalled();
        expect(loggerErrorMock).toHaveBeenCalledWith(
          'revalidate.tenant_id_lookup_failed',
          expect.objectContaining({ tenantProjectId: TENANT_PROJECT_ID }),
        );
      });

      it('returns a non-2xx and revalidates nothing when getTenantById throws', async () => {
        getTenantIdBySanityProjectIdMock.mockResolvedValue(TENANT_ID);
        getTenantByIdMock.mockRejectedValue(
          new Error(CONNECTION_ERROR_MESSAGE),
        );
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(502);
        expect(response.status).not.toBe(HTTP_STATUS.OK);
        expect(json).toEqual({ message: TENANT_LOOKUP_FAILED_MESSAGE });
        expect(revalidateTagMock).not.toHaveBeenCalled();
        expect(revalidatePathMock).not.toHaveBeenCalled();
        expect(loggerErrorMock).toHaveBeenCalledWith(
          'revalidate.tenant_by_id_lookup_failed',
          expect.objectContaining({ tenantId: TENANT_ID }),
        );
      });
    });

    describe('with a signature that fails verification', () => {
      beforeEach(() => {
        isValidSignatureMock.mockResolvedValue(false);
      });

      it('returns 401 and revalidates nothing for an invalid signature', async () => {
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          INVALID_SIGNATURE,
        );
        const response = await POST(request);

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(revalidateTagMock).not.toHaveBeenCalled();
      });

      it('records no tenant activity for an invalid signature', async () => {
        getTenantIdBySanityProjectIdMock.mockResolvedValue(TENANT_ID);
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          INVALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        await POST(request);

        expect(getTenantIdBySanityProjectIdMock).not.toHaveBeenCalled();
        expect(recordTenantActivityMock).not.toHaveBeenCalled();
      });

      it('returns 401 and revalidates nothing when the signature header is missing', async () => {
        const request = makeRequest({ _type: 'page_post', _id: POST_ID });
        const response = await POST(request);

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(isValidSignatureMock).not.toHaveBeenCalled();
        expect(revalidateTagMock).not.toHaveBeenCalled();
      });
    });

    it('returns 200 with no tags revalidated for an unknown _type', async () => {
      const request = makeRequest(
        { _type: 'something_unknown', _id: 'doc-1' },
        VALID_SIGNATURE,
      );
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json).toEqual({
        revalidated: [],
        pathPurged: false,
        type: 'something_unknown',
        id: 'doc-1',
        bookmarksRemoved: 0,
      });
      expect(revalidateTagMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it('returns 400 for a malformed request body', async () => {
      const request = new Request(REVALIDATE_URL, {
        method: HTTP_METHOD.POST,
        headers: { [SIGNATURE_HEADER_NAME]: VALID_SIGNATURE },
        body: 'not json',
      });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(revalidateTagMock).not.toHaveBeenCalled();
    });

    it('returns 400 when the body is valid JSON but missing required fields', async () => {
      const request = makeRequest({ foo: 'bar' }, VALID_SIGNATURE);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(revalidateTagMock).not.toHaveBeenCalled();
    });

    describe('bookmark cleanup on delete', () => {
      beforeEach(() => {
        getTenantIdBySanityProjectIdMock.mockResolvedValue(TENANT_ID);
      });

      it('removes bookmarks for a deleted page_post with a resolvable tenant', async () => {
        removeBookmarksForPostMock.mockResolvedValue(3);
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          {
            [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID,
            [SANITY_OPERATION_HEADER]: 'delete',
          },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(getTenantIdBySanityProjectIdMock).toHaveBeenCalledWith(
          TENANT_PROJECT_ID,
        );
        expect(removeBookmarksForPostMock).toHaveBeenCalledWith(
          TENANT_ID,
          POST_ID,
        );
        expect(json.bookmarksRemoved).toBe(3);
        expect(response.status).toBe(HTTP_STATUS.OK);
      });

      it('does not clean up bookmarks for an update to a page_post', async () => {
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          {
            [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID,
            [SANITY_OPERATION_HEADER]: 'update',
          },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
        expect(json.bookmarksRemoved).toBe(0);
      });

      it('does not clean up bookmarks for a create of a page_post', async () => {
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          {
            [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID,
            [SANITY_OPERATION_HEADER]: 'create',
          },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
        expect(json.bookmarksRemoved).toBe(0);
      });

      it('does not clean up bookmarks when a deleted document is not a page_post', async () => {
        const request = makeRequest(
          { _type: 'author', _id: 'author-1' },
          VALID_SIGNATURE,
          {
            [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID,
            [SANITY_OPERATION_HEADER]: 'delete',
          },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
        expect(json.bookmarksRemoved).toBe(0);
      });

      it('skips cleanup when sanity-project-id is missing on a delete', async () => {
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_OPERATION_HEADER]: 'delete' },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(getTenantIdBySanityProjectIdMock).not.toHaveBeenCalled();
        expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
        expect(json.bookmarksRemoved).toBe(0);
        expect(response.status).toBe(HTTP_STATUS.OK);
      });

      it('skips cleanup when the tenant cannot be resolved from the project id', async () => {
        getTenantIdBySanityProjectIdMock.mockResolvedValue(undefined);
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          {
            [SANITY_PROJECT_ID_HEADER]: 'unknown-project',
            [SANITY_OPERATION_HEADER]: 'delete',
          },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
        expect(json.bookmarksRemoved).toBe(0);
        expect(response.status).toBe(HTTP_STATUS.OK);
      });

      it('still returns 200 with the revalidation result intact when cleanup throws', async () => {
        removeBookmarksForPostMock.mockRejectedValue(
          new Error('db unreachable'),
        );
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          {
            [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID,
            [SANITY_OPERATION_HEADER]: 'delete',
          },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(json).toEqual({
          revalidated: [
            'page_post',
            'posts',
            'author',
            'topic',
            'tag',
            `t:${TENANT_PROJECT_ID}:page_post`,
            `t:${TENANT_PROJECT_ID}:posts`,
            `t:${TENANT_PROJECT_ID}:author`,
            `t:${TENANT_PROJECT_ID}:topic`,
            `t:${TENANT_PROJECT_ID}:tag`,
          ],
          pathPurged: true,
          type: 'page_post',
          id: POST_ID,
          bookmarksRemoved: 0,
        });
        expect(loggerErrorMock).toHaveBeenCalledWith(
          'revalidate.bookmark_cleanup_failed',
          expect.objectContaining({ type: 'page_post', id: POST_ID }),
        );
      });
    });

    describe('resolved path purge', () => {
      beforeEach(() => {
        getTenantIdBySanityProjectIdMock.mockResolvedValue(TENANT_ID);
        isDerivableRevalidateTypeMock.mockReturnValue(true);
        getTenantSanityCredentialsMock.mockResolvedValue({
          projectId: TENANT_PROJECT_ID,
          dataset: 'production',
          token: 'read-token',
        });
      });

      it('purges each derived path instead of the whole site when derivation succeeds', async () => {
        deriveRevalidatePathsMock.mockResolvedValue({
          ok: true,
          paths: [TENANT_HOME_PATH, TENANT_POST_PATH],
        });
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(revalidatePathMock).toHaveBeenCalledWith(TENANT_HOME_PATH);
        expect(revalidatePathMock).toHaveBeenCalledWith(TENANT_POST_PATH);
        expect(revalidatePathMock).not.toHaveBeenCalledWith('/', 'layout');
        expect(loggerWarnMock).not.toHaveBeenCalled();
        expect(json.pathPurged).toBe(true);
      });

      it('falls back to the whole-site purge and logs when tenant credentials are missing', async () => {
        getTenantSanityCredentialsMock.mockResolvedValue(undefined);
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        await POST(request);

        expect(deriveRevalidatePathsMock).not.toHaveBeenCalled();
        expect(loggerErrorMock).toHaveBeenCalledWith(
          'revalidate.tenant_sanity_credentials_missing',
          expect.objectContaining({ type: 'page_post', id: POST_ID }),
        );
        expect(loggerWarnMock).toHaveBeenCalledWith(
          PATH_PURGE_FALLBACK_EVENT,
          expect.objectContaining({ reason: 'fetch_failed' }),
        );
        expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
      });

      it('still runs the whole-site fallback purge when the credentials lookup throws', async () => {
        getTenantSanityCredentialsMock.mockRejectedValue(
          new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.'),
        );
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        const response = await POST(request);

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(deriveRevalidatePathsMock).not.toHaveBeenCalled();
        expect(loggerErrorMock).toHaveBeenCalledWith(
          'revalidate.tenant_sanity_credentials_fetch_threw',
          expect.objectContaining({ type: 'page_post', id: POST_ID }),
        );
        expect(loggerWarnMock).toHaveBeenCalledWith(
          PATH_PURGE_FALLBACK_EVENT,
          expect.objectContaining({ reason: 'fetch_failed' }),
        );
        expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
      });

      it('falls back to the whole-site purge and logs when the paths cannot be derived', async () => {
        deriveRevalidatePathsMock.mockResolvedValue({
          ok: false,
          reason: 'document_not_found',
        });
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        await POST(request);

        expect(loggerWarnMock).toHaveBeenCalledWith(
          PATH_PURGE_FALLBACK_EVENT,
          expect.objectContaining({ reason: 'document_not_found' }),
        );
        expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
      });

      it('falls back to the whole-site purge, logging tenant_unresolved, with no tenant', async () => {
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
        );
        await POST(request);

        expect(isDerivableRevalidateTypeMock).not.toHaveBeenCalled();
        expect(loggerWarnMock).toHaveBeenCalledWith(
          PATH_PURGE_FALLBACK_EVENT,
          expect.objectContaining({ reason: 'tenant_unresolved' }),
        );
        expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
      });

      describe('for a type paths cannot be derived for', () => {
        beforeEach(() => {
          isDerivableRevalidateTypeMock.mockReturnValue(false);
        });

        it('falls back to the whole-site purge, logging unsupported_type, for a new type', async () => {
          const request = makeRequest(
            { _type: 'person', _id: 'author-1' },
            VALID_SIGNATURE,
            { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
          );
          await POST(request);

          expect(loggerWarnMock).toHaveBeenCalledWith(
            PATH_PURGE_FALLBACK_EVENT,
            expect.objectContaining({ reason: 'unsupported_type' }),
          );
          expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
        });

        it('still resolves tenant credentials for an unknown type, for the module lookup', async () => {
          const request = makeRequest(
            { _type: 'person', _id: 'author-1' },
            VALID_SIGNATURE,
            { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
          );
          await POST(request);

          expect(getTenantSanityCredentialsMock).toHaveBeenCalledWith(
            TENANT_ID,
          );
        });
      });
    });

    describe('referencing module purge', () => {
      const withTenant = async (type: string, id: string) => {
        getTenantIdBySanityProjectIdMock.mockResolvedValue(TENANT_ID);
        getTenantSanityCredentialsMock.mockResolvedValue({
          projectId: TENANT_PROJECT_ID,
          dataset: 'production',
          token: 'tok',
        });
        return POST(
          makeRequest({ _type: type, _id: id }, VALID_SIGNATURE, {
            [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID,
          }),
        );
      };

      it('purges a module tag for every module reaching the published document', async () => {
        resolveReferencingModuleTagsMock.mockResolvedValue([
          HERO_MODULE_TAG,
          CTA_MODULE_TAG,
        ]);

        const response = await withTenant('page_topic', 'topic-1');
        const json = await response.json();

        expect(json.revalidated).toContain(HERO_MODULE_TAG);
        expect(json.revalidated).toContain(CTA_MODULE_TAG);
        expect(revalidateTagMock).toHaveBeenCalledWith(HERO_MODULE_TAG, {
          expire: 0,
        });
        expect(revalidateTagMock).toHaveBeenCalledWith(CTA_MODULE_TAG, {
          expire: 0,
        });
      });

      it('purges the tenant-scoped form of each module tag alongside the bare one', async () => {
        resolveReferencingModuleTagsMock.mockResolvedValue([HERO_MODULE_TAG]);

        await withTenant('page_topic', 'topic-1');

        expect(revalidateTagMock).toHaveBeenCalledWith(
          't:tenant-a-project:module:hero-1',
          { expire: 0 },
        );
      });

      it('threads the published document id and tenant context into the lookup', async () => {
        await withTenant('page_topic', 'topic-1');

        expect(resolveReferencingModuleTagsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'page_topic',
            id: 'topic-1',
            tenantId: TENANT_ID,
            tenant: expect.objectContaining({ projectId: TENANT_PROJECT_ID }),
          }),
        );
      });

      it('still purges the document own tags when the lookup resolves nothing', async () => {
        resolveReferencingModuleTagsMock.mockResolvedValue([]);

        const response = await withTenant('page_topic', 'topic-1');
        const json = await response.json();

        expect(json.revalidated).toContain('page_topic');
        expect(revalidateTagMock).toHaveBeenCalledWith('page_topic', {
          expire: 0,
        });
      });

      it('never runs the lookup for a type that purges no tags of its own', async () => {
        await withTenant('settings_voice', 'voice-1');

        expect(resolveReferencingModuleTagsMock).not.toHaveBeenCalled();
      });

      it('never runs the lookup when tenant credentials cannot be resolved', async () => {
        getTenantSanityCredentialsMock.mockResolvedValue(undefined);
        await POST(
          makeRequest(
            { _type: 'page_topic', _id: 'topic-1' },
            VALID_SIGNATURE,
            { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
          ),
        );

        expect(resolveReferencingModuleTagsMock).not.toHaveBeenCalled();
        expect(revalidateTagMock).toHaveBeenCalledWith('page_topic', {
          expire: 0,
        });
      });
    });
  });

  it('returns 500 when SANITY_REVALIDATE_SECRET is not configured', async () => {
    delete envMock.SANITY_REVALIDATE_SECRET;
    const { POST } = await import('./route');

    const request = makeRequest(
      { _type: 'page_post', _id: POST_ID },
      VALID_SIGNATURE,
    );
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(isValidSignatureMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});
