import { HTTP_STATUS } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { CACHE_CONTROL } from '@web/constants/http';
import { PREVIEW_LINK_REFUSAL, PREVIEW_LOG } from '@web/constants/preview';
import { signPreviewLinkToken } from '@web/server/preview/preview-link/preview-link';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import {
  MOCK_PREVIEW_LINK_TTL_MS,
  mockDraftMode,
} from '@web/testing/server/preview/preview';
import {
  MOCK_OTHER_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { NextRequest } from 'next/server';

import { GET } from './route';

faker.seed(7181);

const { envMock, draftModeMock } = vi.hoisted(() => ({
  envMock: {} as { PREVIEW_LINK_SECRET?: string },
  draftModeMock: vi.fn(),
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));
vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock('next/headers', () => ({ draftMode: draftModeMock }));

const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_ORIGIN = `https://${faker.internet.domainName()}`;
const MOCK_PATH = `/${faker.lorem.slug()}`;

const tenant = mockTenant();

const signLink = (tenantId = tenant.id) =>
  signPreviewLinkToken(
    { tenantId, path: MOCK_PATH, exp: Date.now() + MOCK_PREVIEW_LINK_TTL_MS },
    MOCK_SECRET,
  );

const openPreview = (token: string) =>
  GET(
    new NextRequest(
      `${MOCK_ORIGIN}/api/preview?${new URLSearchParams({ token }).toString()}`,
    ),
  );

let draftMode: ReturnType<typeof mockDraftMode>;

beforeEach(() => {
  envMock.PREVIEW_LINK_SECRET = MOCK_SECRET;
  vi.mocked(resolveRequestTenant).mockResolvedValue(tenant);
  draftMode = mockDraftMode();
  draftModeMock.mockResolvedValue(draftMode);
});

describe(GET, () => {
  it('enables Draft Mode and redirects privately to the previewed path', async () => {
    const response = await openPreview(signLink());

    expect(draftMode.enable).toHaveBeenCalledOnce();
    expect(response.headers.get('location')).toBe(`${MOCK_ORIGIN}${MOCK_PATH}`);
    expect(response.headers.get('cache-control')).toBe(
      CACHE_CONTROL.PRIVATE_NO_STORE,
    );
  });

  it("refuses another tenant's link and leaves Draft Mode off", async () => {
    const response = await openPreview(signLink(MOCK_OTHER_TENANT_ID));

    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(draftMode.enable).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(PREVIEW_LOG.LINK_REFUSED, {
      tenantId: tenant.id,
      refusal: PREVIEW_LINK_REFUSAL.OTHER_TENANT,
    });
  });

  it('answers 404 when the host serves no tenant', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

    const response = await openPreview(signLink());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(draftMode.enable).not.toHaveBeenCalled();
  });

  it('answers 500 and logs when the signing secret is unset', async () => {
    delete envMock.PREVIEW_LINK_SECRET;

    const response = await openPreview(signLink());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(draftMode.enable).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(PREVIEW_LOG.SECRET_MISSING);
  });
});
