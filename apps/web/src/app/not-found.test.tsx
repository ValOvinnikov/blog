import { LOCALE_ISO_CODES } from '@blog/config';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { NextIntlClientProvider } from 'next-intl';

import NotFound, { generateMetadata } from './not-found';

const {
  getMessagesMock,
  getTranslationsMock,
  setRequestLocaleMock,
  getThemeTokensMock,
  resolveTenantMessagesMock,
} = vi.hoisted(() => ({
  getMessagesMock: vi.fn(),
  getTranslationsMock: vi.fn(),
  setRequestLocaleMock: vi.fn(),
  getThemeTokensMock: vi.fn(),
  resolveTenantMessagesMock: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getMessages: getMessagesMock,
  getTranslations: getTranslationsMock,
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
const t = Object.assign((key: string) => `translated:${key}`, {
  rich: vi.fn(),
  markup: vi.fn(),
  raw: vi.fn(),
});

const THEME_TOKENS = {
  accentHue: 250,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
  chromeOn: true,
};

describe('NotFound (root not-found route)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMessagesMock.mockResolvedValue(messages);
    getTranslationsMock.mockResolvedValue(t);
    getThemeTokensMock.mockResolvedValue(THEME_TOKENS);
    resolveTenantMessagesMock.mockResolvedValue(voicedMessages);
  });

  describe('generateMetadata', () => {
    it('pins the request locale before reading translations', async () => {
      await generateMetadata();

      expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
      expect(setRequestLocaleMock.mock.invocationCallOrder[0]).toBeLessThan(
        getTranslationsMock.mock.invocationCallOrder[0]!,
      );
    });

    it('builds title and description from the notFound namespace', async () => {
      const metadata = await generateMetadata();

      expect(metadata).toEqual({
        title: 'translated:heading',
        description: 'translated:supportingText',
      });
    });
  });

  it('pins the request locale before rendering', async () => {
    await NotFound();

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(setRequestLocaleMock.mock.invocationCallOrder[0]).toBeLessThan(
      getMessagesMock.mock.invocationCallOrder[0]!,
    );
  });

  it('applies the tenant voice pack to the base messages before rendering', async () => {
    const ui = await NotFound();

    expect(resolveTenantMessagesMock).toHaveBeenCalledWith(messages);
    const provider = ui.props.children;
    expect(provider.props.messages).toBe(voicedMessages);
  });

  it('passes the resolved theme tokens through to ThemeScope', async () => {
    const ui = await NotFound();

    expect(ui.type).toBe(ThemeScope);
    expect(ui.props.themeTokens).toBe(THEME_TOKENS);
  });

  it('wraps NotFoundPage in its own NextIntlClientProvider, independent of any ancestor provider', async () => {
    const ui = await NotFound();
    const provider = ui.props.children;

    expect(provider.type).toBe(NextIntlClientProvider);
    expect(provider.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(provider.props.messages).toBe(voicedMessages);
    expect(provider.props.children.type).toBe(NotFoundPage);
  });
});
