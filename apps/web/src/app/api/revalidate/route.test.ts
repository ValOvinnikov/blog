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
import type * as DeriveRevalidatePathsModule from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { getRevalidateTagsForType } from '@web/utils/revalidate-tags';

import {
  POST,
  SANITY_OPERATION_HEADER,
  SANITY_PROJECT_ID_HEADER,
} from './route';

faker.seed(5722);

const {
  verifyRevalidateSignatureMock,
  revalidateTagMock,
  revalidatePathMock,
  getTenantByIdMock,
  getTenantSanityCredentialsMock,
  removeBookmarksForPostMock,
  deriveRevalidatePathsMock,
  resolveReferencingModuleTagsMock,
  recordTenantActivityMock,
  envMock,
} = vi.hoisted(() => ({
  verifyRevalidateSignatureMock: vi.fn(),
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getTenantSanityCredentialsMock: vi.fn(),
  removeBookmarksForPostMock: vi.fn(),
  deriveRevalidatePathsMock: vi.fn(),
  resolveReferencingModuleTagsMock: vi.fn(),
  recordTenantActivityMock: vi.fn(),
  envMock: {} as { SANITY_REVALIDATE_SECRET?: string },
}));

vi.mock(
  '@web/server/revalidate/verify-revalidate-signature/verify-revalidate-signature',
  () => ({ verifyRevalidateSignature: verifyRevalidateSignatureMock }),
);

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
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
  async (importActual) => ({
    ...(await importActual<typeof DeriveRevalidatePathsModule>()),
    deriveRevalidatePaths: deriveRevalidatePathsMock,
  }),
);

vi.mock(
  '@web/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags',
  () => ({
    resolveReferencingModuleTags: resolveReferencingModuleTagsMock,
  }),
);

vi.mock(
  '@web/server/revalidate/record-tenant-activity/record-tenant-activity',
  () => ({
    recordTenantActivity: recordTenantActivityMock,
  }),
);

const POST_DOCUMENT_TYPE = 'page_post';
const TOPIC_DOCUMENT_TYPE = 'page_topic';
const AUTHOR_DOCUMENT_TYPE = 'person';
const UNTAGGED_DOCUMENT_TYPE = 'settings_voice';
const DELETE_OPERATION = 'delete';
const UPDATE_OPERATION = 'update';
const CREATE_OPERATION = 'create';
const WHOLE_SITE_PURGE_ARGS = ['/', 'layout'];
const EXPIRE_NOW = { expire: 0 };

const MOCK_NOW = faker.date.between({
  from: '2025-01-01T00:00:00Z',
  to: '2026-01-01T00:00:00Z',
});
const MOCK_POST_ID = faker.string.uuid();
const MOCK_TOPIC_ID = faker.string.uuid();
const MOCK_AUTHOR_ID = faker.string.uuid();
const MOCK_DOCUMENT_ID = faker.string.uuid();
const MOCK_UNKNOWN_TYPE = faker.string.alphanumeric(12);
const MOCK_REVALIDATE_URL = faker.internet.url();
const MOCK_REVALIDATE_SECRET = faker.string.alphanumeric(32);
const MOCK_SIGNATURE = faker.string.alphanumeric(24);
const MOCK_TENANT_PROJECT_ID = MOCK_TENANT_SANITY_CONTEXT.projectId;
const MOCK_UNKNOWN_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_TENANT_HOME_PATH = `/${faker.string.uuid()}`;
const MOCK_TENANT_POST_PATH = `${MOCK_TENANT_HOME_PATH}/${faker.lorem.slug()}`;
const MOCK_HERO_MODULE_TAG = `module:${faker.string.uuid()}`;
const MOCK_CTA_MODULE_TAG = `module:${faker.string.uuid()}`;

const POST_TAGS = getRevalidateTagsForType(POST_DOCUMENT_TYPE, MOCK_POST_ID);
const TOPIC_TAGS = getRevalidateTagsForType(TOPIC_DOCUMENT_TYPE, MOCK_TOPIC_ID);

const withTenantScope = (tags: string[]): string[] => [
  ...tags,
  ...tags.map((tag) => `t:${MOCK_TENANT_PROJECT_ID}:${tag}`),
];

const purgedTags = (): unknown[] =>
  revalidateTagMock.mock.calls.map(([tag]) => tag);

const makeRequest = (
  body: unknown,
  signature?: string,
  extraHeaders?: Record<string, string>,
): Request => {
  const headers = new Headers(extraHeaders);
  if (signature !== undefined) {
    headers.set(SIGNATURE_HEADER_NAME, signature);
  }
  return new Request(MOCK_REVALIDATE_URL, {
    method: HTTP_METHOD.POST,
    headers,
    body: JSON.stringify(body),
  });
};

const makeTenantRequest = (
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Request =>
  makeRequest(body, MOCK_SIGNATURE, {
    [SANITY_PROJECT_ID_HEADER]: MOCK_TENANT_PROJECT_ID,
    ...extraHeaders,
  });

const makePostRequest = (extraHeaders?: Record<string, string>): Request =>
  makeTenantRequest(
    { _type: POST_DOCUMENT_TYPE, _id: MOCK_POST_ID },
    extraHeaders,
  );

describe(POST, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MOCK_NOW);
    envMock.SANITY_REVALIDATE_SECRET = MOCK_REVALIDATE_SECRET;
    verifyRevalidateSignatureMock.mockReset();
    verifyRevalidateSignatureMock.mockResolvedValue(okResult(undefined));
    revalidateTagMock.mockReset();
    revalidatePathMock.mockReset();
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(mockTenant());
    getTenantSanityCredentialsMock.mockReset();
    removeBookmarksForPostMock.mockReset();
    deriveRevalidatePathsMock.mockReset();
    resolveReferencingModuleTagsMock.mockReset();
    resolveReferencingModuleTagsMock.mockResolvedValue([]);
    recordTenantActivityMock.mockReset();
    recordTenantActivityMock.mockResolvedValue(undefined);
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.warn).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('revalidates the post tags and purges the whole site for a post webhook', async () => {
    const request = makeRequest(
      { _type: POST_DOCUMENT_TYPE, _id: MOCK_POST_ID },
      MOCK_SIGNATURE,
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(json).toEqual({
      revalidated: POST_TAGS,
      pathPurged: true,
      type: POST_DOCUMENT_TYPE,
      id: MOCK_POST_ID,
      bookmarksRemoved: 0,
    });
    expect(revalidateTagMock.mock.calls).toEqual(
      POST_TAGS.map((tag) => [tag, EXPIRE_NOW]),
    );
    expect(revalidatePathMock.mock.calls).toEqual([WHOLE_SITE_PURGE_ARGS]);
  });

  it('revalidates the bare and tenant-scoped tags when sanity-project-id is present', async () => {
    const request = makePostRequest();
    await POST(request);

    expect(purgedTags()).toEqual(withTenantScope(POST_TAGS));
  });

  it('verifies the raw body and signature against the project id and shared secret', async () => {
    const body = { _type: POST_DOCUMENT_TYPE, _id: MOCK_POST_ID };
    const request = makeTenantRequest(body);
    await POST(request);

    expect(verifyRevalidateSignatureMock).toHaveBeenCalledWith({
      rawBody: JSON.stringify(body),
      signature: MOCK_SIGNATURE,
      projectId: MOCK_TENANT_PROJECT_ID,
      sharedSecret: MOCK_REVALIDATE_SECRET,
      now: MOCK_NOW.getTime(),
    });
  });

  it("records the publishing tenant's activity", async () => {
    verifyRevalidateSignatureMock.mockResolvedValue(okResult(MOCK_TENANT_ID));

    const request = makePostRequest();
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(recordTenantActivityMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_NOW,
    );
  });

  it('revalidates without recording activity when no tenant resolves', async () => {
    const request = makeRequest(
      { _type: POST_DOCUMENT_TYPE, _id: MOCK_POST_ID },
      MOCK_SIGNATURE,
    );
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(recordTenantActivityMock).not.toHaveBeenCalled();
    expect(purgedTags()).toEqual(POST_TAGS);
  });

  it('ignores the event and revalidates nothing when the tenant is archived', async () => {
    verifyRevalidateSignatureMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
    getTenantByIdMock.mockResolvedValue(undefined);

    const request = makePostRequest();
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(logger.warn).toHaveBeenCalledWith(REVALIDATE_LOG.TENANT_ARCHIVED, {
      tenantProjectId: MOCK_TENANT_PROJECT_ID,
      tenantId: MOCK_TENANT_ID,
    });
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(recordTenantActivityMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      case: 'the project-id lookup throws',
      arrange: () => {
        verifyRevalidateSignatureMock.mockRejectedValue(MOCK_ERROR);
      },
      event: REVALIDATE_LOG.TENANT_ID_LOOKUP_FAILED,
      context: { tenantProjectId: MOCK_TENANT_PROJECT_ID, error: MOCK_ERROR },
    },
    {
      case: 'getTenantById throws',
      arrange: () => {
        verifyRevalidateSignatureMock.mockResolvedValue(
          okResult(MOCK_TENANT_ID),
        );
        getTenantByIdMock.mockRejectedValue(MOCK_ERROR);
      },
      event: REVALIDATE_LOG.TENANT_BY_ID_LOOKUP_FAILED,
      context: { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
    },
  ])(
    'responds bad gateway and revalidates nothing when $case',
    async ({ arrange, event, context }) => {
      arrange();

      const request = makePostRequest();
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_GATEWAY);
      expect(json).toEqual({ message: TENANT_LOOKUP_FAILED_MESSAGE });
      expect(revalidateTagMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(event, context);
    },
  );

  it('refuses silently and touches no tenant for an invalid signature', async () => {
    verifyRevalidateSignatureMock.mockResolvedValue(
      errorResult(SIGNATURE_REFUSED_REASON),
    );

    const request = makePostRequest();
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(recordTenantActivityMock).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('revalidates no tags for an unknown document type', async () => {
    const request = makeRequest(
      { _type: MOCK_UNKNOWN_TYPE, _id: MOCK_DOCUMENT_ID },
      MOCK_SIGNATURE,
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(json).toEqual({
      revalidated: [],
      pathPurged: false,
      type: MOCK_UNKNOWN_TYPE,
      id: MOCK_DOCUMENT_ID,
      bookmarksRemoved: 0,
    });
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it.each([
    { case: 'a body that is not JSON', body: faker.lorem.word() },
    { case: 'JSON missing _type and _id', body: JSON.stringify({}) },
  ])('rejects $case as a bad request', async ({ body }) => {
    const request = new Request(MOCK_REVALIDATE_URL, {
      method: HTTP_METHOD.POST,
      headers: { [SIGNATURE_HEADER_NAME]: MOCK_SIGNATURE },
      body,
    });
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('fails without verifying when the revalidate secret is not configured', async () => {
    delete envMock.SANITY_REVALIDATE_SECRET;

    const request = makeRequest(
      { _type: POST_DOCUMENT_TYPE, _id: MOCK_POST_ID },
      MOCK_SIGNATURE,
    );
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(verifyRevalidateSignatureMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  describe('bookmark cleanup on delete', () => {
    beforeEach(() => {
      verifyRevalidateSignatureMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
    });

    it('removes bookmarks for a deleted post with a resolvable tenant', async () => {
      removeBookmarksForPostMock.mockResolvedValue(3);

      const request = makePostRequest({
        [SANITY_OPERATION_HEADER]: DELETE_OPERATION,
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(removeBookmarksForPostMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
      );
      expect(json.bookmarksRemoved).toBe(3);
    });

    it.each([
      {
        case: 'an update to a post',
        type: POST_DOCUMENT_TYPE,
        id: MOCK_POST_ID,
        operation: UPDATE_OPERATION,
      },
      {
        case: 'a create of a post',
        type: POST_DOCUMENT_TYPE,
        id: MOCK_POST_ID,
        operation: CREATE_OPERATION,
      },
      {
        case: 'a deleted document that is not a post',
        type: AUTHOR_DOCUMENT_TYPE,
        id: MOCK_AUTHOR_ID,
        operation: DELETE_OPERATION,
      },
    ])(
      'does not clean up bookmarks for $case',
      async ({ type, id, operation }) => {
        const request = makeTenantRequest(
          { _type: type, _id: id },
          { [SANITY_OPERATION_HEADER]: operation },
        );
        const response = await POST(request);
        const json = await response.json();

        expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
        expect(json.bookmarksRemoved).toBe(0);
      },
    );

    it('skips cleanup when the tenant cannot be resolved from the project id', async () => {
      verifyRevalidateSignatureMock.mockResolvedValue(okResult(undefined));

      const request = makeRequest(
        { _type: POST_DOCUMENT_TYPE, _id: MOCK_POST_ID },
        MOCK_SIGNATURE,
        {
          [SANITY_PROJECT_ID_HEADER]: MOCK_UNKNOWN_PROJECT_ID,
          [SANITY_OPERATION_HEADER]: DELETE_OPERATION,
        },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
      expect(json.bookmarksRemoved).toBe(0);
    });

    it('keeps the revalidation result intact when cleanup throws', async () => {
      removeBookmarksForPostMock.mockRejectedValue(MOCK_ERROR);

      const request = makePostRequest({
        [SANITY_OPERATION_HEADER]: DELETE_OPERATION,
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json).toEqual({
        revalidated: withTenantScope(POST_TAGS),
        pathPurged: true,
        type: POST_DOCUMENT_TYPE,
        id: MOCK_POST_ID,
        bookmarksRemoved: 0,
      });
      expect(logger.error).toHaveBeenCalledWith(
        REVALIDATE_LOG.BOOKMARK_CLEANUP_FAILED,
        { type: POST_DOCUMENT_TYPE, id: MOCK_POST_ID, error: MOCK_ERROR },
      );
    });
  });

  describe('resolved path purge', () => {
    beforeEach(() => {
      verifyRevalidateSignatureMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
      getTenantSanityCredentialsMock.mockResolvedValue(
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('purges each derived path', async () => {
      deriveRevalidatePathsMock.mockResolvedValue(
        okResult([MOCK_TENANT_HOME_PATH, MOCK_TENANT_POST_PATH]),
      );

      const request = makePostRequest();
      const response = await POST(request);
      const json = await response.json();

      expect(revalidatePathMock.mock.calls).toEqual([
        [MOCK_TENANT_HOME_PATH],
        [MOCK_TENANT_POST_PATH],
      ]);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(json.pathPurged).toBe(true);
    });

    it.each([
      {
        case: 'tenant credentials are missing',
        arrange: () => {
          getTenantSanityCredentialsMock.mockResolvedValue(undefined);
        },
        event: REVALIDATE_LOG.TENANT_SANITY_CREDENTIALS_MISSING,
        context: {
          type: POST_DOCUMENT_TYPE,
          id: MOCK_POST_ID,
          tenantId: MOCK_TENANT_ID,
        },
      },
      {
        case: 'the credentials lookup throws',
        arrange: () => {
          getTenantSanityCredentialsMock.mockRejectedValue(MOCK_ERROR);
        },
        event: REVALIDATE_LOG.TENANT_SANITY_CREDENTIALS_FETCH_THREW,
        context: {
          type: POST_DOCUMENT_TYPE,
          id: MOCK_POST_ID,
          tenantId: MOCK_TENANT_ID,
          error: MOCK_ERROR,
        },
      },
    ])(
      'falls back to the whole-site purge and logs when $case',
      async ({ arrange, event, context }) => {
        arrange();

        const request = makePostRequest();
        const response = await POST(request);

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(deriveRevalidatePathsMock).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(event, context);
        expect(logger.warn).toHaveBeenCalledWith(
          REVALIDATE_LOG.PATH_PURGE_FALLBACK,
          {
            type: POST_DOCUMENT_TYPE,
            id: MOCK_POST_ID,
            tenantId: MOCK_TENANT_ID,
            reason: FETCH_FAILED_REASON,
          },
        );
        expect(revalidatePathMock).toHaveBeenCalledWith(
          ...WHOLE_SITE_PURGE_ARGS,
        );
      },
    );

    it('falls back to the whole-site purge and logs when paths cannot be derived', async () => {
      deriveRevalidatePathsMock.mockResolvedValue(
        errorResult(DOCUMENT_NOT_FOUND_REASON),
      );

      const request = makePostRequest();
      await POST(request);

      expect(logger.warn).toHaveBeenCalledWith(
        REVALIDATE_LOG.PATH_PURGE_FALLBACK,
        {
          type: POST_DOCUMENT_TYPE,
          id: MOCK_POST_ID,
          tenantId: MOCK_TENANT_ID,
          reason: DOCUMENT_NOT_FOUND_REASON,
        },
      );
      expect(revalidatePathMock).toHaveBeenCalledWith(...WHOLE_SITE_PURGE_ARGS);
    });

    it('falls back to the whole-site purge and logs when no tenant resolves', async () => {
      verifyRevalidateSignatureMock.mockResolvedValue(okResult(undefined));

      const request = makeRequest(
        { _type: POST_DOCUMENT_TYPE, _id: MOCK_POST_ID },
        MOCK_SIGNATURE,
      );
      await POST(request);

      expect(logger.warn).toHaveBeenCalledWith(
        REVALIDATE_LOG.PATH_PURGE_FALLBACK,
        {
          type: POST_DOCUMENT_TYPE,
          id: MOCK_POST_ID,
          tenantId: undefined,
          reason: TENANT_UNRESOLVED_REASON,
        },
      );
      expect(revalidatePathMock).toHaveBeenCalledWith(...WHOLE_SITE_PURGE_ARGS);
    });

    it('falls back to the whole-site purge and logs for a type it cannot derive', async () => {
      const request = makeTenantRequest({
        _type: AUTHOR_DOCUMENT_TYPE,
        _id: MOCK_AUTHOR_ID,
      });
      await POST(request);

      expect(logger.warn).toHaveBeenCalledWith(
        REVALIDATE_LOG.PATH_PURGE_FALLBACK,
        {
          type: AUTHOR_DOCUMENT_TYPE,
          id: MOCK_AUTHOR_ID,
          tenantId: MOCK_TENANT_ID,
          reason: UNSUPPORTED_TYPE_REASON,
        },
      );
      expect(revalidatePathMock).toHaveBeenCalledWith(...WHOLE_SITE_PURGE_ARGS);
    });

    it('still resolves tenant credentials for a type it cannot derive', async () => {
      const request = makeTenantRequest({
        _type: AUTHOR_DOCUMENT_TYPE,
        _id: MOCK_AUTHOR_ID,
      });
      await POST(request);

      expect(getTenantSanityCredentialsMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
    });
  });

  describe('referencing module purge', () => {
    beforeEach(() => {
      verifyRevalidateSignatureMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
      getTenantSanityCredentialsMock.mockResolvedValue(
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('purges bare and tenant-scoped tags for every module reaching the document', async () => {
      resolveReferencingModuleTagsMock.mockResolvedValue([
        MOCK_HERO_MODULE_TAG,
        MOCK_CTA_MODULE_TAG,
      ]);

      const request = makeTenantRequest({
        _type: TOPIC_DOCUMENT_TYPE,
        _id: MOCK_TOPIC_ID,
      });
      const response = await POST(request);
      const json = await response.json();

      const expectedTags = withTenantScope([
        ...TOPIC_TAGS,
        MOCK_HERO_MODULE_TAG,
        MOCK_CTA_MODULE_TAG,
      ]);

      expect(json.revalidated).toEqual(expectedTags);
      expect(revalidateTagMock.mock.calls).toEqual(
        expectedTags.map((tag) => [tag, EXPIRE_NOW]),
      );
    });

    it('hands the published document and tenant context to the module lookup', async () => {
      const request = makeTenantRequest({
        _type: TOPIC_DOCUMENT_TYPE,
        _id: MOCK_TOPIC_ID,
      });
      await POST(request);

      expect(resolveReferencingModuleTagsMock).toHaveBeenCalledWith({
        type: TOPIC_DOCUMENT_TYPE,
        id: MOCK_TOPIC_ID,
        tenantId: MOCK_TENANT_ID,
        tenant: MOCK_TENANT_SANITY_CONTEXT,
      });
    });

    it("still purges the document's own tags when the lookup resolves nothing", async () => {
      const request = makeTenantRequest({
        _type: TOPIC_DOCUMENT_TYPE,
        _id: MOCK_TOPIC_ID,
      });
      await POST(request);

      expect(purgedTags()).toEqual(withTenantScope(TOPIC_TAGS));
    });

    it('never runs the module lookup for a type that purges no tags of its own', async () => {
      const request = makeTenantRequest({
        _type: UNTAGGED_DOCUMENT_TYPE,
        _id: MOCK_DOCUMENT_ID,
      });
      await POST(request);

      expect(resolveReferencingModuleTagsMock).not.toHaveBeenCalled();
    });

    it('never runs the module lookup when tenant credentials cannot be resolved', async () => {
      getTenantSanityCredentialsMock.mockResolvedValue(undefined);

      const request = makeTenantRequest({
        _type: TOPIC_DOCUMENT_TYPE,
        _id: MOCK_TOPIC_ID,
      });
      await POST(request);

      expect(resolveReferencingModuleTagsMock).not.toHaveBeenCalled();
      expect(purgedTags()).toEqual(withTenantScope(TOPIC_TAGS));
    });
  });
});
