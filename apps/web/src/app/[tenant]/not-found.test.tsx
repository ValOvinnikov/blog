import { LOCALE_ISO_CODES } from '@blog/config';
import { getNotFoundContext } from '@web/server/request-context/request-context';

import TenantNotFound, { generateMetadata } from './not-found';

const { standaloneNotFoundPageMock, buildNotFoundMetadataMock, headersMock } =
  vi.hoisted(() => ({
    standaloneNotFoundPageMock: vi.fn(),
    buildNotFoundMetadataMock: vi.fn(),
    headersMock: vi.fn(),
  }));

vi.mock('@web/components/pages/standalone-not-found-page', () => ({
  StandaloneNotFoundPage: standaloneNotFoundPageMock,
}));

vi.mock('@web/metadata/not-found-metadata', () => ({
  buildNotFoundMetadata: buildNotFoundMetadataMock,
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('next/headers', () => ({ headers: headersMock }));

const TENANT_ID = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

describe('TenantNotFound ([tenant] not-found route)', () => {
  describe('generateMetadata', () => {
    it('delegates to buildNotFoundMetadata', async () => {
      const metadata = { title: 'Page not found' };
      buildNotFoundMetadataMock.mockResolvedValue(metadata);

      await expect(generateMetadata()).resolves.toBe(metadata);
    });
  });

  it('renders the page for the remembered tenant in the served language, never reading the request header', async () => {
    const ui = { type: 'div', props: {} };
    standaloneNotFoundPageMock.mockResolvedValue(ui);
    vi.mocked(getNotFoundContext).mockResolvedValue({
      tenantId: TENANT_ID,
      locale: LOCALE_ISO_CODES.NL,
      isDefaultLocale: false,
    });

    const document = await TenantNotFound();

    expect(document.props.lang).toBe('nl');
    expect(document.props.children).toBe(ui);
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith({
      tenant: TENANT_ID,
      locale: LOCALE_ISO_CODES.NL,
      hasVoiceOverrides: false,
    });
    expect(headersMock).not.toHaveBeenCalled();
  });

  it('applies voice overrides in the default language', async () => {
    vi.mocked(getNotFoundContext).mockResolvedValue({
      tenantId: TENANT_ID,
      locale: LOCALE_ISO_CODES.DE,
      isDefaultLocale: true,
    });

    const document = await TenantNotFound();

    expect(document.props.lang).toBe('de');
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ hasVoiceOverrides: true }),
    );
  });
});
