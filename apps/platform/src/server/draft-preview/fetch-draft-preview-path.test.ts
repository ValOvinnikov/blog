import { faker } from '@faker-js/faker';
import {
  DRAFT_PREVIEW_LOG,
  DRAFT_PREVIEW_REFUSAL,
} from '@platform/constants/draft-preview';
import { MOCK_WEB_APP_URL } from '@platform/testing/env/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockedWebSecretsEnv } from '@platform/testing/env/mocked-web-secrets-env';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_STATUS } from '@shinefold/config';

import { fetchDraftPreviewPath } from './fetch-draft-preview-path';

faker.seed(7180);

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/web-secrets-env/web-secrets-env');

const loggerErrorMock = vi.mocked(logger.error);

const MOCK_DOCUMENT_ID = `drafts.${faker.string.alphanumeric(12)}`;
const MOCK_DRAFT_PATH = `/nl/${faker.lorem.slug()}/caf%C3%A9`;

const fetchPath = () => fetchDraftPreviewPath(MOCK_TENANT_ID, MOCK_DOCUMENT_ID);

describe(fetchDraftPreviewPath, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    loggerErrorMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(Response.json({ path: MOCK_DRAFT_PATH }));
    vi.stubGlobal('fetch', fetchMock);
    mockedEnv.WEB_APP_URL = MOCK_WEB_APP_URL;
    mockedWebSecretsEnv.INTERNAL_PAGES_SECRET = faker.string.alphanumeric(32);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks the website's path route for the document's tenant", async () => {
    await fetchPath();

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(url.toString()).toBe(
      `${MOCK_WEB_APP_URL}/api/internal/pages/${encodeURIComponent(MOCK_DOCUMENT_ID)}/path`,
    );
    expect(JSON.parse(init.body as string)).toEqual({
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('returns the path exactly as the website answers it', async () => {
    const result = await fetchPath();

    expect(result).toEqual({ isResolved: true, path: MOCK_DRAFT_PATH });
  });

  it.each([
    [HTTP_STATUS.NOT_FOUND, DRAFT_PREVIEW_REFUSAL.NOT_FOUND],
    [HTTP_STATUS.CONFLICT, DRAFT_PREVIEW_REFUSAL.LANGUAGE_OFF],
  ])('refuses quietly when the website answers %i', async (status, refusal) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));

    const result = await fetchPath();

    expect(result).toEqual({ isResolved: false, refusal });
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('refuses and logs the status when the website fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
    );

    const result = await fetchPath();

    expect(result).toEqual({
      isResolved: false,
      refusal: DRAFT_PREVIEW_REFUSAL.UNAVAILABLE,
    });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      DRAFT_PREVIEW_LOG.PATH_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        documentId: MOCK_DOCUMENT_ID,
        responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  });

  it('refuses and logs an answer without a path', async () => {
    fetchMock.mockResolvedValue(Response.json({}));

    const result = await fetchPath();

    expect(result).toEqual({
      isResolved: false,
      refusal: DRAFT_PREVIEW_REFUSAL.UNAVAILABLE,
    });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      DRAFT_PREVIEW_LOG.PATH_FAILED,
      expect.objectContaining({ responseStatus: HTTP_STATUS.OK }),
    );
  });

  it('refuses and logs when the request throws', async () => {
    fetchMock.mockRejectedValue(MOCK_NETWORK_ERROR);

    const result = await fetchPath();

    expect(result).toEqual({
      isResolved: false,
      refusal: DRAFT_PREVIEW_REFUSAL.UNAVAILABLE,
    });
    expect(loggerErrorMock).toHaveBeenCalledWith(DRAFT_PREVIEW_LOG.PATH_ERROR, {
      tenantId: MOCK_TENANT_ID,
      documentId: MOCK_DOCUMENT_ID,
      errorName: MOCK_NETWORK_ERROR.name,
    });
  });

  it('asks nothing, refuses and logs while the website route is not configured', async () => {
    mockedWebSecretsEnv.INTERNAL_PAGES_SECRET = undefined;

    const result = await fetchPath();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      isResolved: false,
      refusal: DRAFT_PREVIEW_REFUSAL.UNAVAILABLE,
    });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      DRAFT_PREVIEW_LOG.PATH_SKIPPED,
      { hasWebAppUrl: true, hasSecret: false },
    );
  });
});
