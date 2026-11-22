import { faker } from '@faker-js/faker';
import type { TMaybeNull } from '@shinefold/config';
import {
  HTTP_METHOD,
  HTTP_STATUS,
  POST_SUMMARY_MAX_WORDS,
} from '@shinefold/config/constants';
import { errorResult, okResult } from '@shinefold/utils';
import { isNull } from '@shinefold/utils/primitives';
import {
  GENERATE_SKIM_LOG,
  SUMMARY_BLOCK_STYLE,
} from '@web/constants/generate-skim';
import { toSummaryPortableText } from '@web/server/skim/to-summary-portable-text/to-summary-portable-text';
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
  claimTakeawayGenerationMock,
  releaseTakeawayGenerationMock,
  envMock,
  MOCK_SKIM_MODEL,
} = vi.hoisted(() => ({
  getPublishedPostBodyMock: vi.fn(),
  saveSkimDraftMock: vi.fn(),
  generateTakeawaysMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
  getHostTenantSanityWriteContextMock: vi.fn(),
  getPlatformSanityWriteContextMock: vi.fn(),
  claimTakeawayGenerationMock: vi.fn(),
  releaseTakeawayGenerationMock: vi.fn(),
  envMock: {} as {
    SANITY_GENERATE_SECRET?: string;
    ANTHROPIC_API_KEY?: string;
  },
  MOCK_SKIM_MODEL: 'claude-haiku-5-5',
}));

vi.mock('@shinefold/db', () => ({
  queries: {
    takeawayGenerations: {
      claimTakeawayGeneration: claimTakeawayGenerationMock,
      releaseTakeawayGeneration: releaseTakeawayGenerationMock,
    },
  },
}));

vi.mock('@shinefold/service', () => ({
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

const MOCK_GENERATE_SKIM_URL = faker.internet.url({ appendSlash: false });
const MOCK_SECRET = faker.string.alphanumeric(16);
const MOCK_WRONG_SECRET = faker.string.alphanumeric(16);
const MOCK_ANTHROPIC_KEY = faker.string.alphanumeric(16);
const MOCK_POST_ID = faker.string.uuid();
const MOCK_POST_BODY: unknown[] = [];
const MOCK_SUMMARY_BLOCKS = faker.helpers.multiple(
  () => ({
    style: SUMMARY_BLOCK_STYLE.PARAGRAPH,
    text: faker.lorem.sentence(),
  }),
  { count: 2 },
);
const MOCK_TEXTLESS_SUMMARY_BLOCKS = [
  { style: SUMMARY_BLOCK_STYLE.PARAGRAPH, text: ' ' },
  { style: SUMMARY_BLOCK_STYLE.BULLET, text: '****' },
];
const MOCK_OVERLONG_SUMMARY_BLOCKS = [
  {
    style: SUMMARY_BLOCK_STYLE.PARAGRAPH,
    text: faker.lorem.words(POST_SUMMARY_MAX_WORDS + 1),
  },
];
const MOCK_ERROR = new Error(faker.lorem.sentence());
const MOCK_CLAIM = { tenantId: MOCK_TENANT_ID, month: '2026-11-01' };

const buildCredentials = () => ({
  projectId: faker.string.alphanumeric(8),
  dataset: faker.string.alphanumeric(8),
  token: faker.string.alphanumeric(16),
});

const MOCK_PLATFORM_CREDENTIALS = buildCredentials();
const MOCK_WRITE_CREDENTIALS = buildCredentials();

const MOCK_SAVED_DRAFT = {
  postId: MOCK_POST_ID,
  summary: toSummaryPortableText(MOCK_SUMMARY_BLOCKS),
  model: MOCK_SKIM_MODEL,
};

const buildRequest = (
  rawBody: string,
  secret: TMaybeNull<string> = MOCK_SECRET,
): Request => {
  const url = new URL(MOCK_GENERATE_SKIM_URL);
  if (!isNull(secret)) url.searchParams.set('secret', secret);
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
    generateTakeawaysMock.mockResolvedValue(MOCK_SUMMARY_BLOCKS);
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
    claimTakeawayGenerationMock.mockReset();
    claimTakeawayGenerationMock.mockResolvedValue(MOCK_CLAIM);
    releaseTakeawayGenerationMock.mockReset();
    releaseTakeawayGenerationMock.mockResolvedValue(undefined);
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

  it('saves the summary to the draft with the platform credentials', async () => {
    const response = await POST(postRequest());
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(json).toEqual({ ok: true, count: MOCK_SUMMARY_BLOCKS.length });
    expect(claimTakeawayGenerationMock).not.toHaveBeenCalled();
    expect(getPublishedPostBodyMock).toHaveBeenCalledWith(
      MOCK_POST_ID,
      undefined,
    );
    expect(saveSkimDraftMock).toHaveBeenCalledWith(
      MOCK_SAVED_DRAFT,
      MOCK_PLATFORM_CREDENTIALS,
    );
  });

  it('patches the same draft on every run', async () => {
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
    expect(claimTakeawayGenerationMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
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
      GENERATE_SKIM_LOG.TENANT_WRITE_CREDENTIALS_MISSING,
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
      GENERATE_SKIM_LOG.TENANT_NOT_ACTIVE,
      { postId: MOCK_POST_ID, tenantId: MOCK_TENANT_ID },
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

    expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
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
      GENERATE_SKIM_LOG.WRITE_CLIENT_UNCONFIGURED,
      { postId: MOCK_POST_ID, error: MOCK_ERROR },
    );
  });

  it('fails when saving the draft fails', async () => {
    saveSkimDraftMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const response = await POST(postRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  describe('for a resolved tenant', () => {
    beforeEach(() => {
      getHostTenantSanityWriteContextMock.mockResolvedValue({
        isResolvable: true,
        tenant: MOCK_WRITE_CREDENTIALS,
        tenantId: MOCK_TENANT_ID,
        isActive: true,
      });
    });

    it('refuses a used allowance like an inactive tenant, without generating', async () => {
      claimTakeawayGenerationMock.mockResolvedValue(null);

      const response = await POST(postRequest());

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
      expect(generateTakeawaysMock).not.toHaveBeenCalled();
      expect(saveSkimDraftMock).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('answers unavailable and logs it when the claim cannot be made', async () => {
      claimTakeawayGenerationMock.mockRejectedValue(MOCK_ERROR);

      const response = await POST(postRequest());

      expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(logger.error).toHaveBeenCalledWith(
        GENERATE_SKIM_LOG.CLAIM_FAILED,
        {
          postId: MOCK_POST_ID,
          tenantId: MOCK_TENANT_ID,
          error: MOCK_ERROR,
        },
      );
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    });

    it('keeps the claim when the summary is saved', async () => {
      await POST(postRequest());

      expect(releaseTakeawayGenerationMock).not.toHaveBeenCalled();
    });

    it('gives the claim back when the post body cannot be read', async () => {
      getPublishedPostBodyMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await POST(postRequest());

      expect(releaseTakeawayGenerationMock).toHaveBeenCalledWith(MOCK_CLAIM);
    });

    it.each([
      [
        'the post body cannot be read',
        GENERATE_SKIM_LOG.POST_BODY_FETCH_FAILED,
        () =>
          getPublishedPostBodyMock.mockResolvedValue(errorResult(MOCK_ERROR)),
      ],
      [
        'generation fails',
        GENERATE_SKIM_LOG.GENERATION_FAILED,
        () => generateTakeawaysMock.mockRejectedValue(MOCK_ERROR),
      ],
      [
        'the draft cannot be saved',
        GENERATE_SKIM_LOG.DRAFT_SAVE_FAILED,
        () => saveSkimDraftMock.mockResolvedValue(errorResult(MOCK_ERROR)),
      ],
    ])("logs the tenant's id when %s", async (_case, event, fail) => {
      fail();

      await POST(postRequest());

      expect(logger.error).toHaveBeenCalledWith(event, {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        error: MOCK_ERROR,
      });
    });

    describe.each([
      ['runs over the word limit', MOCK_OVERLONG_SUMMARY_BLOCKS],
      ['has no text', MOCK_TEXTLESS_SUMMARY_BLOCKS],
    ])('when the summary %s', (_case, blocks) => {
      beforeEach(() => {
        generateTakeawaysMock.mockResolvedValue(blocks);
      });

      it('refuses it, saves nothing and gives the claim back', async () => {
        const response = await POST(postRequest());

        expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
        expect(saveSkimDraftMock).not.toHaveBeenCalled();
        expect(releaseTakeawayGenerationMock).toHaveBeenCalledWith(MOCK_CLAIM);
      });
    });

    describe('when generation fails', () => {
      beforeEach(() => {
        generateTakeawaysMock.mockRejectedValue(MOCK_ERROR);
      });

      it('gives the claim back', async () => {
        await POST(postRequest());

        expect(releaseTakeawayGenerationMock).toHaveBeenCalledWith(MOCK_CLAIM);
      });

      it('logs a failed claim release and still answers the failure', async () => {
        releaseTakeawayGenerationMock.mockRejectedValue(MOCK_ERROR);

        const response = await POST(postRequest());

        expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
        expect(logger.error).toHaveBeenCalledWith(
          GENERATE_SKIM_LOG.CLAIM_RELEASE_FAILED,
          { postId: MOCK_POST_ID, tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
        );
      });
    });
  });
});
