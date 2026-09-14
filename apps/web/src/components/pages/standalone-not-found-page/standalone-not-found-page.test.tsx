import { LOCALE_ISO_CODES } from '@blog/config';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { NextIntlClientProvider } from 'next-intl';

import { StandaloneNotFoundPage } from './standalone-not-found-page';

const {
  getMessagesMock,
  setRequestLocaleMock,
  getThemeTokensMock,
  resolveTenantMessagesMock,
  toThemeTokensMock,
} = vi.hoisted(() => ({
  getMessagesMock: vi.fn(),
  setRequestLocaleMock: vi.fn(),
  getThemeTokensMock: vi.fn(),
  resolveTenantMessagesMock: vi.fn(),
  toThemeTokensMock: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getMessages: getMessagesMock,
  setRequestLocale: setRequestLocaleMock,
}));

vi.mock('@web/utils/get-theme-tokens', () => ({
  getThemeTokens: getThemeTokensMock,
}));

vi.mock('@web/utils/resolve-tenant-messages', () => ({
  resolveTenantMessages: resolveTenantMessagesMock,
}));

vi.mock('@web/utils/to-theme-tokens', () => ({
  toThemeTokens: toThemeTokensMock,
}));

const messages = { notFound: { commandNotFound: 'Not found' } };
const voicedMessages = { notFound: { commandNotFound: 'command not found' } };

const THEME_TOKENS = {
  accentHue: 250,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
};

const DEFAULT_THEME_TOKENS = {
  accentHue: 200,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
};

describe(`<${StandaloneNotFoundPage.name}/>`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMessagesMock.mockResolvedValue(messages);
    getThemeTokensMock.mockResolvedValue(THEME_TOKENS);
    resolveTenantMessagesMock.mockResolvedValue({
      messages: voicedMessages,
      rich: {},
    });
    toThemeTokensMock.mockReturnValue(DEFAULT_THEME_TOKENS);
  });

  it('pins the request locale before resolving messages', async () => {
    await StandaloneNotFoundPage();

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(setRequestLocaleMock.mock.invocationCallOrder[0]).toBeLessThan(
      getMessagesMock.mock.invocationCallOrder[0]!,
    );
  });

  describe('given a tenant', () => {
    it('resolves theme tokens and messages with that tenant', async () => {
      await StandaloneNotFoundPage({ tenant: 'tenant-1' });

      expect(getThemeTokensMock).toHaveBeenCalledWith('tenant-1');
      expect(resolveTenantMessagesMock).toHaveBeenCalledWith(
        messages,
        'tenant-1',
      );
      expect(toThemeTokensMock).not.toHaveBeenCalled();
    });

    it('passes the resolved theme tokens through to ThemeScope', async () => {
      const ui = await StandaloneNotFoundPage({ tenant: 'tenant-1' });

      expect(ui.type).toBe(ThemeScope);
      expect(ui.props.themeTokens).toBe(THEME_TOKENS);
    });

    it('wraps NotFoundPage in its own NextIntlClientProvider, independent of any ancestor provider', async () => {
      const ui = await StandaloneNotFoundPage({ tenant: 'tenant-1' });
      const provider = ui.props.children;

      expect(provider.type).toBe(NextIntlClientProvider);
      expect(provider.props.locale).toBe(LOCALE_ISO_CODES.EN);
      expect(provider.props.messages).toBe(voicedMessages);
      expect(provider.props.children.type).toBe(NotFoundPage);
    });
  });

  describe('given no tenant', () => {
    it('never calls getThemeTokens or resolveTenantMessages', async () => {
      await StandaloneNotFoundPage();

      expect(getThemeTokensMock).not.toHaveBeenCalled();
      expect(resolveTenantMessagesMock).not.toHaveBeenCalled();
    });

    it('renders with default theme tokens and the base, un-voiced messages', async () => {
      const ui = await StandaloneNotFoundPage();

      expect(toThemeTokensMock).toHaveBeenCalledWith(undefined);
      expect(ui.props.themeTokens).toBe(DEFAULT_THEME_TOKENS);

      const provider = ui.props.children;
      expect(provider.props.messages).toBe(messages);
    });
  });
});
