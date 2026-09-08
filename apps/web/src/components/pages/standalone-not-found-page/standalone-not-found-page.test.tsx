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
} = vi.hoisted(() => ({
  getMessagesMock: vi.fn(),
  setRequestLocaleMock: vi.fn(),
  getThemeTokensMock: vi.fn(),
  resolveTenantMessagesMock: vi.fn(),
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

const messages = { notFound: { commandNotFound: 'Not found' } };
const voicedMessages = { notFound: { commandNotFound: 'command not found' } };

const THEME_TOKENS = {
  accentHue: 250,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
};

describe(StandaloneNotFoundPage, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMessagesMock.mockResolvedValue(messages);
    getThemeTokensMock.mockResolvedValue(THEME_TOKENS);
    resolveTenantMessagesMock.mockResolvedValue({
      messages: voicedMessages,
      rich: {},
    });
  });

  it('pins the request locale before resolving messages', async () => {
    await StandaloneNotFoundPage();

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(setRequestLocaleMock.mock.invocationCallOrder[0]).toBeLessThan(
      getMessagesMock.mock.invocationCallOrder[0]!,
    );
  });

  it('resolves theme tokens and messages with no tenant argument, falling through to the request header', async () => {
    await StandaloneNotFoundPage();

    expect(getThemeTokensMock).toHaveBeenCalledWith();
    expect(resolveTenantMessagesMock).toHaveBeenCalledWith(messages);
  });

  it('passes the resolved theme tokens through to ThemeScope', async () => {
    const ui = await StandaloneNotFoundPage();

    expect(ui.type).toBe(ThemeScope);
    expect(ui.props.themeTokens).toBe(THEME_TOKENS);
  });

  it('wraps NotFoundPage in its own NextIntlClientProvider, independent of any ancestor provider', async () => {
    const ui = await StandaloneNotFoundPage();
    const provider = ui.props.children;

    expect(provider.type).toBe(NextIntlClientProvider);
    expect(provider.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(provider.props.messages).toBe(voicedMessages);
    expect(provider.props.children.type).toBe(NotFoundPage);
  });
});
