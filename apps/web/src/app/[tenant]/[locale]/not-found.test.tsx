import { NotFoundPage } from '@web/components/pages/not-found-page';

import TenantLocaleNotFound, { generateMetadata } from './not-found';

const {
  headersMock,
  getSiteConfigMock,
  getThemeTokensMock,
  resolveTenantMessagesMock,
  buildNotFoundMetadataMock,
} = vi.hoisted(() => ({
  headersMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
  getThemeTokensMock: vi.fn(),
  resolveTenantMessagesMock: vi.fn(),
  buildNotFoundMetadataMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: headersMock }));

vi.mock('@web/server/site-config/get-site-config', () => ({
  getSiteConfig: getSiteConfigMock,
}));

vi.mock('@web/utils/get-theme-tokens', () => ({
  getThemeTokens: getThemeTokensMock,
}));

vi.mock('@web/utils/resolve-tenant-messages', () => ({
  resolveTenantMessages: resolveTenantMessagesMock,
}));

vi.mock('@web/metadata/not-found-metadata', () => ({
  buildNotFoundMetadata: buildNotFoundMetadataMock,
}));

describe('TenantLocaleNotFound ([tenant]/[locale] not-found route)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('delegates to buildNotFoundMetadata', async () => {
      const metadata = { title: 'Page not found' };
      buildNotFoundMetadataMock.mockResolvedValue(metadata);

      await expect(generateMetadata()).resolves.toBe(metadata);
    });
  });

  it('renders NotFoundPage without resolving any site config, theme, or message context', () => {
    const ui = TenantLocaleNotFound();

    expect(ui.type).toBe(NotFoundPage);
    expect(headersMock).not.toHaveBeenCalled();
    expect(getSiteConfigMock).not.toHaveBeenCalled();
    expect(getThemeTokensMock).not.toHaveBeenCalled();
    expect(resolveTenantMessagesMock).not.toHaveBeenCalled();
  });
});
