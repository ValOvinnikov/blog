import { faker } from '@faker-js/faker';
import {
  DRAFT_PREVIEW_LOG,
  DRAFT_PREVIEW_REFUSAL,
  PREVIEW_TOKEN_QUERY_PARAM,
} from '@platform/constants/draft-preview';
import { mockedWebSecretsEnv } from '@platform/testing/env/mocked-web-secrets-env';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_CUSTOM_DOMAIN_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_URL,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { TENANT_STATUS } from '@shinefold/db/constants';
import { readPreviewTokenClaims } from '@shinefold/utils/preview-token';

import { fetchDraftPreviewPath } from './fetch-draft-preview-path';
import {
  DRAFT_PREVIEW_TOKEN_TTL_MS,
  resolveDraftPreview,
  type TDraftPreview,
} from './resolve-draft-preview';

faker.seed(71800);

vi.mock('@platform/utils/web-secrets-env/web-secrets-env');
vi.mock('./fetch-draft-preview-path', () => ({
  fetchDraftPreviewPath: vi.fn(),
}));

const fetchDraftPreviewPathMock = vi.mocked(fetchDraftPreviewPath);
const loggerErrorMock = vi.mocked(logger.error);

const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_DOCUMENT_ID = faker.string.alphanumeric(12);
const MOCK_DRAFT_PATH = `/${faker.lorem.slug()}/caf%C3%A9`;
const MOCK_NOW = 1_800_000_000_000;

const tokenOf = (frameUrl: string) =>
  new URL(frameUrl).searchParams.get(PREVIEW_TOKEN_QUERY_PARAM) ?? '';

describe(resolveDraftPreview, () => {
  beforeEach(() => {
    loggerErrorMock.mockReset();
    fetchDraftPreviewPathMock.mockReset();
    fetchDraftPreviewPathMock.mockResolvedValue({
      isResolved: true,
      path: MOCK_DRAFT_PATH,
    });
    mockedWebSecretsEnv.PREVIEW_LINK_SECRET = MOCK_SECRET;
  });

  describe('for an active tenant', () => {
    let preview: TDraftPreview;

    beforeEach(async () => {
      preview = await resolveDraftPreview(
        mockTenant(),
        MOCK_DOCUMENT_ID,
        MOCK_NOW,
      );
    });

    it("frames the draft path on the tenant's main address", () => {
      expect(preview).toEqual({
        isReady: true,
        frameUrl: expect.stringMatching(
          new RegExp(`^${MOCK_TENANT_URL}${MOCK_DRAFT_PATH}\\?`),
        ),
        publishedUrl: `${MOCK_TENANT_URL}${MOCK_DRAFT_PATH}`,
        siteUrl: MOCK_TENANT_URL,
        path: MOCK_DRAFT_PATH,
      });
      expect(fetchDraftPreviewPathMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_DOCUMENT_ID,
      );
    });

    it('signs a token the website accepts for this tenant and path, for a few minutes', () => {
      const token = preview.isReady ? tokenOf(preview.frameUrl) : '';
      const claimsNow = readPreviewTokenClaims(token, MOCK_SECRET, MOCK_NOW);
      const claimsAtExpiry = readPreviewTokenClaims(
        token,
        MOCK_SECRET,
        MOCK_NOW + DRAFT_PREVIEW_TOKEN_TTL_MS,
      );

      expect(claimsNow).toEqual({
        tenantId: MOCK_TENANT_ID,
        path: MOCK_DRAFT_PATH,
        expiresAt: MOCK_NOW + DRAFT_PREVIEW_TOKEN_TTL_MS,
      });
      expect(claimsAtExpiry).toBeUndefined();
    });
  });

  it('frames a custom domain when it is the main address', async () => {
    const preview = await resolveDraftPreview(
      mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
      MOCK_DOCUMENT_ID,
      MOCK_NOW,
    );

    expect(preview).toMatchObject({
      isReady: true,
      publishedUrl: `${MOCK_CUSTOM_DOMAIN_URL}${MOCK_DRAFT_PATH}`,
    });
  });

  it('signs a new token on every load', async () => {
    const first = await resolveDraftPreview(
      mockTenant(),
      MOCK_DOCUMENT_ID,
      MOCK_NOW,
    );
    const second = await resolveDraftPreview(
      mockTenant(),
      MOCK_DOCUMENT_ID,
      MOCK_NOW + 1,
    );

    expect(first.isReady && second.isReady).toBe(true);
    expect(first).not.toEqual(second);
  });

  it.each([
    [
      'archived',
      { deprovisionedAt: new Date(MOCK_NOW) },
      DRAFT_PREVIEW_REFUSAL.ARCHIVED,
    ],
    [
      'marked archived',
      { status: TENANT_STATUS.ARCHIVED },
      DRAFT_PREVIEW_REFUSAL.ARCHIVED,
    ],
    [
      'suspended',
      { status: TENANT_STATUS.SUSPENDED },
      DRAFT_PREVIEW_REFUSAL.SUSPENDED,
    ],
  ])(
    'refuses a tenant that is %s without asking for a path',
    async (_label, overrides, refusal) => {
      const preview = await resolveDraftPreview(
        mockTenant(overrides),
        MOCK_DOCUMENT_ID,
      );

      expect(preview).toEqual({ isReady: false, refusal });
      expect(fetchDraftPreviewPathMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).not.toHaveBeenCalled();
    },
  );

  it('refuses and logs while the preview secret is missing', async () => {
    mockedWebSecretsEnv.PREVIEW_LINK_SECRET = undefined;

    const preview = await resolveDraftPreview(mockTenant(), MOCK_DOCUMENT_ID);

    expect(preview).toEqual({
      isReady: false,
      refusal: DRAFT_PREVIEW_REFUSAL.UNAVAILABLE,
    });
    expect(fetchDraftPreviewPathMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      DRAFT_PREVIEW_LOG.SECRET_MISSING,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('passes on the refusal of a path that cannot be resolved', async () => {
    fetchDraftPreviewPathMock.mockResolvedValue({
      isResolved: false,
      refusal: DRAFT_PREVIEW_REFUSAL.LANGUAGE_OFF,
    });

    const preview = await resolveDraftPreview(mockTenant(), MOCK_DOCUMENT_ID);

    expect(preview).toEqual({
      isReady: false,
      refusal: DRAFT_PREVIEW_REFUSAL.LANGUAGE_OFF,
    });
  });
});
