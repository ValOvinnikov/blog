import type { TMaybeNull } from '@blog/config';
import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { POST } from './route';

const {
  getPublishedPostBodyMock,
  saveSkimDraftMock,
  generateTakeawaysMock,
  getHostTenantSanityContextMock,
  getHostTenantSanityWriteContextMock,
  getPlatformSanityWriteContextMock,
  envMock,
  MOCK_SKIM_MODEL,
} = vi.hoisted(() => ({
  getPublishedPostBodyMock: vi.fn(),
  saveSkimDraftMock: vi.fn(),
  generateTakeawaysMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
  getHostTenantSanityWriteContextMock: vi.fn(),
  getPlatformSanityWriteContextMock: vi.fn(),
  envMock: {} as {
    SANITY_GENERATE_SECRET?: string;
    ANTHROPIC_API_KEY?: string;
  },
  MOCK_SKIM_MODEL: 'claude-haiku-4-5',
}));

vi.mock('@blog/service', () => ({
  service: {
    editorial: {
      skim: {
        v1: {
          getPublishedPostBody: getPublishedPostBodyMock,
          saveSkimDraft: saveSkimDraftMock,
        },
      },
    },
  },
  getPlatformSanityWriteContext: getPlatformSanityWriteContextMock,
}));

vi.mock('@web/server/skim/generate-takeaways/generate-takeaways', () => ({
  generateTakeaways: generateTakeawaysMock,
  SKIM_GENERATION_MODEL: MOCK_SKIM_MODEL,
}));

vi.mock(
  '@web/server/tenant/tenant-sanity-context/tenant-sanity-context',
  () => ({
    getHostTenantSanityContext: getHostTenantSanityContextMock,
    getHostTenantSanityWriteContext: getHostTenantSanityWriteContextMock,
  }),
);

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

faker.seed(6009);

const UNPROCESSABLE_ENTITY_STATUS = 422;
const MOCK_GENERATE_SKIM_URL = faker.internet.url({ appendSlash: false });
const MOCK_SECRET = faker.string.alphanumeric(16);
const MOCK_WRONG_SECRET = faker.string.alphanumeric(16);
const MOCK_ANTHROPIC_KEY = faker.string.alphanumeric(16);
const MOCK_POST_ID = faker.string.uuid();
const MOCK_POST_BODY: unknown[] = [];
const MOCK_TAKEAWAYS = faker.helpers.multiple(() => faker.lorem.sentence(), {
  count: 3,
});
const MOCK_ERROR = new Error(faker.lorem.sentence());

const buildCredentials = () => ({
  projectId: faker.string.alphanumeric(8),
  dataset: faker.string.alphanumeric(8),
  token: faker.string.alphanumeric(16),
});

const MOCK_PLATFORM_CREDENTIALS = buildCredentials();
const MOCK_WRITE_CREDENTIALS = buildCredentials();

const MOCK_SAVED_DRAFT = {
  postId: MOCK_POST_ID,
  takeaways: MOCK_TAKEAWAYS,
  model: MOCK_SKIM_MODEL,
};

const buildRequest = (
  rawBody: string,
  secret: TMaybeNull<string> = MOCK_SECRET,
): Request => {
  const url = new URL(MOCK_GENERATE_SKIM_URL);
  if (secret !== null) url.searchParams.set('secret', secret);
  return new Request(url, { method: HTTP_METHOD.POST, body: rawBody });
};

const postRequest = (
  secret?: TMaybeNull<string>,
  body: unknown = { _id: MOCK_POST_ID },
): Request => buildRequest(JSON.stringify(body), secret);

describe(POST, () => {
  beforeEach(() => {
    envMock.SANITY_GENERATE_SECRET = MOCK_SECRET;
    envMock.ANTHROPIC_API_KEY = MOCK_ANTHROPIC_KEY;
    getPublishedPostBodyMock.mockReset();
    getPublishedPostBodyMock.mockResolvedValue(okResult(MOCK_POST_BODY));
    generateTakeawaysMock.mockReset();
    generateTakeawaysMock.mockResolvedValue(MOCK_TAKEAWAYS);
    saveSkimDraftMock.mockReset();
    saveSkimDraftMock.mockResolvedValue(okResult());
    getHostTenantSanityContextMock.mockReset();
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: undefined,
    });
    getHostTenantSanityWriteContextMock.mockReset();
    getHostTenantSanityWriteContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: undefined,
      tenantId: undefined,
      isActive: true,
    });
    getPlatformSanityWriteContextMock.mockReset();
    getPlatformSanityWriteContextMock.mockReturnValue(
      MOCK_PLATFORM_CREDENTIALS,
    );
  });

  it.each([
    ['is missing', null],
    ['does not match', MOCK_WRONG_SECRET],
  ])('refuses a request whose secret %s', async (_case, secret) => {
    const response = await POST(postRequest(secret));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });

  it.each(['ANTHROPIC_API_KEY', 'SANITY_GENERATE_SECRET'] as const)(
    'refuses service when %s is not configured',
    async (key) => {
      delete envMock[key];

      const response = await POST(postRequest());

      expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['a body that is not JSON', 'not json'],
    ['a JSON body without _id', JSON.stringify({ foo: 'bar' })],
  ])('rejects %s', async (_case, rawBody) => {
    const response = await POST(buildRequest(rawBody));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });

  it('saves generated takeaways to the draft with the platform credentials', async () => {
    const response = await POST(postRequest());
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(json).toEqual({ ok: true, count: MOCK_TAKEAWAYS.length });
    expect(getPublishedPostBodyMock).toHaveBeenCalledWith(
      MOCK_POST_ID,
      undefined,
    );
    expect(saveSkimDraftMock).toHaveBeenCalledWith(
      MOCK_SAVED_DRAFT,
      MOCK_PLATFORM_CREDENTIALS,
    );
  });

  it('patches the same draft on every run instead of appending', async () => {
    await POST(postRequest());
    await POST(postRequest());

    expect(saveSkimDraftMock.mock.calls).toEqual([
      [MOCK_SAVED_DRAFT, MOCK_PLATFORM_CREDENTIALS],
      [MOCK_SAVED_DRAFT, MOCK_PLATFORM_CREDENTIALS],
    ]);
  });

  it('reads the post with the resolved tenant Sanity context', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: MOCK_TENANT_SANITY_CONTEXT,
    });

    await POST(postRequest());

    expect(getPublishedPostBodyMock).toHaveBeenCalledWith(
      MOCK_POST_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('saves the draft with the active tenant write credentials', async () => {
    getHostTenantSanityWriteContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: MOCK_WRITE_CREDENTIALS,
      tenantId: MOCK_TENANT_ID,
      isActive: true,
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(saveSkimDraftMock).toHaveBeenCalledWith(
      MOCK_SAVED_DRAFT,
      MOCK_WRITE_CREDENTIALS,
    );
    expect(getPlatformSanityWriteContextMock).not.toHaveBeenCalled();
  });

  it.each([
    ['read', getHostTenantSanityContextMock],
    ['write', getHostTenantSanityWriteContextMock],
  ])(
    'answers not found when the %s-side tenant is unresolvable',
    async (_side, resolver) => {
      resolver.mockResolvedValue({ isResolvable: false });

      const response = await POST(postRequest());

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    },
  );

  it('refuses a tenant without write credentials and logs it', async () => {
    getHostTenantSanityWriteContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: undefined,
      tenantId: MOCK_TENANT_ID,
      isActive: true,
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(logger.error).toHaveBeenCalledWith(
      'generate_skim.tenant_write_credentials_missing',
      { postId: MOCK_POST_ID, tenantId: MOCK_TENANT_ID },
    );
    expect(generateTakeawaysMock).not.toHaveBeenCalled();
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    expect(saveSkimDraftMock).not.toHaveBeenCalled();
  });

  it('refuses an inactive tenant and logs it', async () => {
    getHostTenantSanityWriteContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: MOCK_WRITE_CREDENTIALS,
      tenantId: MOCK_TENANT_ID,
      isActive: false,
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(logger.warn).toHaveBeenCalledWith(
      'generate_skim.tenant_not_active',
      {
        postId: MOCK_POST_ID,
        tenantId: MOCK_TENANT_ID,
      },
    );
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    expect(generateTakeawaysMock).not.toHaveBeenCalled();
    expect(saveSkimDraftMock).not.toHaveBeenCalled();
  });

  it('fails without generating when reading the post body fails', async () => {
    getPublishedPostBodyMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const response = await POST(postRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(generateTakeawaysMock).not.toHaveBeenCalled();
  });

  it('leaves the draft untouched when the generated response is malformed', async () => {
    generateTakeawaysMock.mockRejectedValue(MOCK_ERROR);

    const response = await POST(postRequest());

    expect(response.status).toBe(UNPROCESSABLE_ENTITY_STATUS);
    expect(saveSkimDraftMock).not.toHaveBeenCalled();
  });

  it('refuses to save when the platform write context is unconfigured', async () => {
    getPlatformSanityWriteContextMock.mockImplementationOnce(() => {
      throw MOCK_ERROR;
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(saveSkimDraftMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'generate_skim.write_client_unconfigured',
      { postId: MOCK_POST_ID, error: MOCK_ERROR },
    );
  });

  it('fails when saving the draft fails', async () => {
    saveSkimDraftMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const response = await POST(postRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});
