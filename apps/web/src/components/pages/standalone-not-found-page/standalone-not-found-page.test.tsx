import { LOCALE_ISO_CODES, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { makeFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';
import { NextIntlClientProvider } from 'next-intl';

import { StandaloneNotFoundPage } from './standalone-not-found-page';

const {
  setRequestLocaleMock,
  getThemeTokensMock,
  resolveTenantMessagesMock,
  toThemeTokensMock,
} = vi.hoisted(() => ({
  setRequestLocaleMock: vi.fn(),
  getThemeTokensMock: vi.fn(),
  resolveTenantMessagesMock: vi.fn(),
  toThemeTokensMock: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
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

const messages = SITE_MESSAGES_BY_LOCALE.EN;
const voicedMessages = { notFound: { commandNotFound: 'command not found' } };
const voicedSupportingText = makeFormattedVoiceRich();

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
    getThemeTokensMock.mockResolvedValue(THEME_TOKENS);
    resolveTenantMessagesMock.mockResolvedValue({
      messages: voicedMessages,
      rich: { notFoundSupportingText: voicedSupportingText },
    });
    toThemeTokensMock.mockReturnValue(DEFAULT_THEME_TOKENS);
  });

  it('renders in English by default', async () => {
    const ui = await StandaloneNotFoundPage();

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(ui.props.children.props.locale).toBe(LOCALE_ISO_CODES.EN);
  });

  it('renders in the given language with its messages', async () => {
    const ui = await StandaloneNotFoundPage({ locale: LOCALE_ISO_CODES.NL });
    const provider = ui.props.children;

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.NL);
    expect(provider.props.locale).toBe(LOCALE_ISO_CODES.NL);
    expect(provider.props.messages).toBe(SITE_MESSAGES_BY_LOCALE.NL);
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

    it('keeps the base messages but the tenant theme without voice overrides', async () => {
      const ui = await StandaloneNotFoundPage({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.NL,
        hasVoiceOverrides: false,
      });

      expect(resolveTenantMessagesMock).not.toHaveBeenCalled();
      expect(ui.props.themeTokens).toBe(THEME_TOKENS);
      expect(ui.props.children.props.messages).toBe(SITE_MESSAGES_BY_LOCALE.NL);
      expect(ui.props.children.props.children.props.supportingText).toEqual(
        resolveVoiceRichFields({}, SITE_MESSAGES_BY_LOCALE.NL)
          .notFoundSupportingText,
      );
    });

    it('wraps NotFoundPage in its own NextIntlClientProvider, independent of any ancestor provider', async () => {
      const ui = await StandaloneNotFoundPage({ tenant: 'tenant-1' });
      const provider = ui.props.children;

      expect(provider.type).toBe(NextIntlClientProvider);
      expect(provider.props.locale).toBe(LOCALE_ISO_CODES.EN);
      expect(provider.props.messages).toBe(voicedMessages);
      expect(provider.props.children.type).toBe(NotFoundPage);
      expect(provider.props.children.props.supportingText).toBe(
        voicedSupportingText,
      );
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
