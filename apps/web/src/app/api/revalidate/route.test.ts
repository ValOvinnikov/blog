import { LOCALE_ISO_CODES } from '@blog/config';
import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import {
  DOCUMENT_NOT_FOUND_REASON,
  FETCH_FAILED_REASON,
  REVALIDATE_LOG,
  SIGNATURE_REFUSED_REASON,
  TENANT_LOOKUP_FAILED_MESSAGE,
  TENANT_UNRESOLVED_REASON,
  UNSUPPORTED_TYPE_REASON,
} from '@web/constants/revalidate';
import { MOCK_ERROR_MESSAGE } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { SANITY_OPERATION_HEADER, SANITY_PROJECT_ID_HEADER } from './route';

faker.seed(5722);

const { verifyRevalidateSignatureMock } = vi.hoisted(() => ({
  verifyRevalidateSignatureMock: vi.fn(),
}));

const { revalidateTagMock, revalidatePathMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

const {
  getTenantByIdMock,
  getTenantSanityCredentialsMock,
  removeBookmarksForPostMock,
} = vi.hoisted(() => ({
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

vi.mock(
  '@web/server/revalidate/verify-revalidate-signature/verify-revalidate-signature',
  () => ({ verifyRevalidateSignature: verifyRevalidateSignatureMock }),
);

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

let loggerErrorMock = vi.mocked(logger.error);
let loggerWarnMock = vi.mocked(logger.warn);

const { EN } = LOCALE_ISO_CODES;

const POST_ID = faker.string.uuid();
const TOPIC_ID = faker.string.uuid();
const AUTHOR_ID = faker.string.uuid();
const DOCUMENT_ID = faker.string.uuid();
const REVALIDATE_URL = faker.internet.url();
const REVALIDATE_SECRET = faker.string.alphanumeric(32);
const VALID_SIGNATURE = faker.string.alphanumeric(24);
const INVALID_SIGNATURE = faker.string.alphanumeric(24);
const TENANT_PROJECT_ID = faker.string.alphanumeric(8);
const UNKNOWN_PROJECT_ID = faker.string.alphanumeric(8);
const TENANT_SANITY_CONTEXT = {
  projectId: TENANT_PROJECT_ID,
  dataset: faker.lorem.word(),
  token: faker.string.alphanumeric(32),
};
const TENANT_HOME_PATH = `/${MOCK_TENANT_ID}/${EN}`;
const TENANT_POST_PATH = `${TENANT_HOME_PATH}/blog/${faker.lorem.slug()}`;
const HERO_MODULE_TAG = `module:${faker.string.uuid()}`;
const CTA_MODULE_TAG = `module:${faker.string.uuid()}`;

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
    envMock.SANITY_REVALIDATE_SECRET = REVALIDATE_SECRET;
    verifyRevalidateSignatureMock.mockReset();
    revalidateTagMock.mockReset();
    revalidatePathMock.mockReset();
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue({ id: MOCK_TENANT_ID });
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
      verifyRevalidateSignatureMock.mockResolvedValue(okResult(undefined));
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

    it("verifies the raw body and signature against the request's project id and the shared secret", async () => {
      const body = { _type: 'page_post', _id: POST_ID };
      const request = makeRequest(body, VALID_SIGNATURE, {
        [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID,
      });
      await POST(request);

      expect(verifyRevalidateSignatureMock).toHaveBeenCalledWith({
        rawBody: JSON.stringify(body),
        signature: VALID_SIGNATURE,
        projectId: TENANT_PROJECT_ID,
        sharedSecret: REVALIDATE_SECRET,
        now: expect.any(Number),
      });
    });

    describe('tenant activity', () => {
      it("records the publishing tenant's activity", async () => {
        verifyRevalidateSignatureMock.mockResolvedValue(
          okResult(MOCK_TENANT_ID),
        );
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        const response = await POST(request);

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(recordTenantActivityMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          expect.any(Date),
        );
      });

      it('records no activity for an archived tenant', async () => {
        verifyRevalidateSignatureMock.mockResolvedValue(
          okResult(MOCK_TENANT_ID),
        );
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
        verifyRevalidateSignatureMock.mockResolvedValue(
          okResult(MOCK_TENANT_ID),
        );
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
      it.each([
        {
          case: 'the project-id lookup throws',
          arrange: () => {
            verifyRevalidateSignatureMock.mockRejectedValue(
              new Error(MOCK_ERROR_MESSAGE),
            );
          },
          event: REVALIDATE_LOG.TENANT_ID_LOOKUP_FAILED,
          context: { tenantProjectId: TENANT_PROJECT_ID },
        },
        {
          case: 'getTenantById throws',
          arrange: () => {
            verifyRevalidateSignatureMock.mockResolvedValue(
              okResult(MOCK_TENANT_ID),
            );
            getTenantByIdMock.mockRejectedValue(new Error(MOCK_ERROR_MESSAGE));
          },
          event: REVALIDATE_LOG.TENANT_BY_ID_LOOKUP_FAILED,
          context: { tenantId: MOCK_TENANT_ID },
        },
      ])(
        'returns 502 and revalidates nothing when $case',
        async ({ arrange, event, context }) => {
          arrange();
          const request = makeRequest(
            { _type: 'page_post', _id: POST_ID },
            VALID_SIGNATURE,
            { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
          );
          const response = await POST(request);
          const json = await response.json();

          expect(response.status).toBe(HTTP_STATUS.BAD_GATEWAY);
          expect(json).toEqual({ message: TENANT_LOOKUP_FAILED_MESSAGE });
          expect(revalidateTagMock).not.toHaveBeenCalled();
          expect(revalidatePathMock).not.toHaveBeenCalled();
          expect(loggerErrorMock).toHaveBeenCalledWith(
            event,
            expect.objectContaining(context),
          );
        },
      );
    });

    describe('with a signature that fails verification', () => {
      beforeEach(() => {
        verifyRevalidateSignatureMock.mockResolvedValue(
          errorResult(SIGNATURE_REFUSED_REASON),
        );
      });

      it('returns 401 and revalidates nothing for an invalid signature', async () => {
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          INVALID_SIGNATURE,
        );
        const response = await POST(request);

        expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(revalidateTagMock).not.toHaveBeenCalled();
        expect(loggerErrorMock).not.toHaveBeenCalled();
        expect(loggerWarnMock).not.toHaveBeenCalled();
      });

      it('records no tenant activity for an invalid signature', async () => {
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          INVALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        await POST(request);

        expect(getTenantByIdMock).not.toHaveBeenCalled();
        expect(recordTenantActivityMock).not.toHaveBeenCalled();
      });
    });

    it('returns 200 with no tags revalidated for an unknown _type', async () => {
      const request = makeRequest(
        { _type: 'something_unknown', _id: DOCUMENT_ID },
        VALID_SIGNATURE,
      );
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json).toEqual({
        revalidated: [],
        pathPurged: false,
        type: 'something_unknown',
        id: DOCUMENT_ID,
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
        verifyRevalidateSignatureMock.mockResolvedValue(
          okResult(MOCK_TENANT_ID),
        );
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

        expect(verifyRevalidateSignatureMock).toHaveBeenCalledWith(
          expect.objectContaining({ projectId: TENANT_PROJECT_ID }),
        );
        expect(removeBookmarksForPostMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          POST_ID,
        );
        expect(json.bookmarksRemoved).toBe(3);
        expect(response.status).toBe(HTTP_STATUS.OK);
      });

      it.each([
        {
          case: 'an update to a page_post',
          _type: 'page_post',
          id: POST_ID,
          operation: 'update',
        },
        {
          case: 'a create of a page_post',
          _type: 'page_post',
          id: POST_ID,
          operation: 'create',
        },
        {
          case: 'a deleted document that is not a page_post',
          _type: 'author',
          id: AUTHOR_ID,
          operation: 'delete',
        },
      ])(
        'does not clean up bookmarks for $case',
        async ({ _type, id, operation }) => {
          const request = makeRequest({ _type, _id: id }, VALID_SIGNATURE, {
            [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID,
            [SANITY_OPERATION_HEADER]: operation,
          });
          const response = await POST(request);
          const json = await response.json();

          expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
          expect(json.bookmarksRemoved).toBe(0);
        },
      );

      it('skips cleanup when the tenant cannot be resolved from the project id', async () => {
        verifyRevalidateSignatureMock.mockResolvedValue(okResult(undefined));
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          {
            [SANITY_PROJECT_ID_HEADER]: UNKNOWN_PROJECT_ID,
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
          new Error(MOCK_ERROR_MESSAGE),
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
          REVALIDATE_LOG.BOOKMARK_CLEANUP_FAILED,
          expect.objectContaining({ type: 'page_post', id: POST_ID }),
        );
      });
    });

    describe('resolved path purge', () => {
      beforeEach(() => {
        verifyRevalidateSignatureMock.mockResolvedValue(
          okResult(MOCK_TENANT_ID),
        );
        isDerivableRevalidateTypeMock.mockReturnValue(true);
        getTenantSanityCredentialsMock.mockResolvedValue(TENANT_SANITY_CONTEXT);
      });

      it('purges each derived path instead of the whole site when derivation succeeds', async () => {
        deriveRevalidatePathsMock.mockResolvedValue(
          okResult([TENANT_HOME_PATH, TENANT_POST_PATH]),
        );
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

      it.each([
        {
          case: 'tenant credentials are missing',
          arrange: () => {
            getTenantSanityCredentialsMock.mockResolvedValue(undefined);
          },
          event: REVALIDATE_LOG.TENANT_SANITY_CREDENTIALS_MISSING,
        },
        {
          case: 'the credentials lookup throws',
          arrange: () => {
            getTenantSanityCredentialsMock.mockRejectedValue(
              new Error(MOCK_ERROR_MESSAGE),
            );
          },
          event: REVALIDATE_LOG.TENANT_SANITY_CREDENTIALS_FETCH_THREW,
        },
      ])(
        'falls back to the whole-site purge and logs when $case',
        async ({ arrange, event }) => {
          arrange();
          const request = makeRequest(
            { _type: 'page_post', _id: POST_ID },
            VALID_SIGNATURE,
            { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
          );
          const response = await POST(request);

          expect(response.status).toBe(HTTP_STATUS.OK);
          expect(deriveRevalidatePathsMock).not.toHaveBeenCalled();
          expect(loggerErrorMock).toHaveBeenCalledWith(
            event,
            expect.objectContaining({ type: 'page_post', id: POST_ID }),
          );
          expect(loggerWarnMock).toHaveBeenCalledWith(
            REVALIDATE_LOG.PATH_PURGE_FALLBACK,
            expect.objectContaining({ reason: FETCH_FAILED_REASON }),
          );
          expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
        },
      );

      it('falls back to the whole-site purge and logs when the paths cannot be derived', async () => {
        deriveRevalidatePathsMock.mockResolvedValue(
          errorResult(DOCUMENT_NOT_FOUND_REASON),
        );
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
          { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
        );
        await POST(request);

        expect(loggerWarnMock).toHaveBeenCalledWith(
          REVALIDATE_LOG.PATH_PURGE_FALLBACK,
          expect.objectContaining({ reason: DOCUMENT_NOT_FOUND_REASON }),
        );
        expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
      });

      it('falls back to the whole-site purge, logging tenant_unresolved, with no tenant', async () => {
        verifyRevalidateSignatureMock.mockResolvedValue(okResult(undefined));
        const request = makeRequest(
          { _type: 'page_post', _id: POST_ID },
          VALID_SIGNATURE,
        );
        await POST(request);

        expect(isDerivableRevalidateTypeMock).not.toHaveBeenCalled();
        expect(loggerWarnMock).toHaveBeenCalledWith(
          REVALIDATE_LOG.PATH_PURGE_FALLBACK,
          expect.objectContaining({ reason: TENANT_UNRESOLVED_REASON }),
        );
        expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
      });

      describe('for a type paths cannot be derived for', () => {
        beforeEach(() => {
          isDerivableRevalidateTypeMock.mockReturnValue(false);
        });

        it('falls back to the whole-site purge, logging unsupported_type, for a new type', async () => {
          const request = makeRequest(
            { _type: 'person', _id: AUTHOR_ID },
            VALID_SIGNATURE,
            { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
          );
          await POST(request);

          expect(loggerWarnMock).toHaveBeenCalledWith(
            REVALIDATE_LOG.PATH_PURGE_FALLBACK,
            expect.objectContaining({ reason: UNSUPPORTED_TYPE_REASON }),
          );
          expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
        });

        it('still resolves tenant credentials for an unknown type, for the module lookup', async () => {
          const request = makeRequest(
            { _type: 'person', _id: AUTHOR_ID },
            VALID_SIGNATURE,
            { [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID },
          );
          await POST(request);

          expect(getTenantSanityCredentialsMock).toHaveBeenCalledWith(
            MOCK_TENANT_ID,
          );
        });
      });
    });

    describe('referencing module purge', () => {
      const withTenant = async (type: string, id: string) => {
        verifyRevalidateSignatureMock.mockResolvedValue(
          okResult(MOCK_TENANT_ID),
        );
        getTenantSanityCredentialsMock.mockResolvedValue(TENANT_SANITY_CONTEXT);
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

        const response = await withTenant('page_topic', TOPIC_ID);
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

        await withTenant('page_topic', TOPIC_ID);

        expect(revalidateTagMock).toHaveBeenCalledWith(
          `t:${TENANT_PROJECT_ID}:${HERO_MODULE_TAG}`,
          { expire: 0 },
        );
      });

      it('threads the published document id and tenant context into the lookup', async () => {
        await withTenant('page_topic', TOPIC_ID);

        expect(resolveReferencingModuleTagsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'page_topic',
            id: TOPIC_ID,
            tenantId: MOCK_TENANT_ID,
            tenant: expect.objectContaining({ projectId: TENANT_PROJECT_ID }),
          }),
        );
      });

      it('still purges the document own tags when the lookup resolves nothing', async () => {
        resolveReferencingModuleTagsMock.mockResolvedValue([]);

        const response = await withTenant('page_topic', TOPIC_ID);
        const json = await response.json();

        expect(json.revalidated).toContain('page_topic');
        expect(revalidateTagMock).toHaveBeenCalledWith('page_topic', {
          expire: 0,
        });
      });

      it('never runs the lookup for a type that purges no tags of its own', async () => {
        await withTenant('settings_voice', DOCUMENT_ID);

        expect(resolveReferencingModuleTagsMock).not.toHaveBeenCalled();
      });

      it('never runs the lookup when tenant credentials cannot be resolved', async () => {
        getTenantSanityCredentialsMock.mockResolvedValue(undefined);
        await POST(
          makeRequest({ _type: 'page_topic', _id: TOPIC_ID }, VALID_SIGNATURE, {
            [SANITY_PROJECT_ID_HEADER]: TENANT_PROJECT_ID,
          }),
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
    expect(verifyRevalidateSignatureMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});
