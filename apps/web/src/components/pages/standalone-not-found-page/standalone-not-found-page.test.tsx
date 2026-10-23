import { LOCALE_ISO_CODES, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { DENSITY, FONT_CHOICE, RADIUS_SCALE } from '@blog/config/constants';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
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
const voicedSupportingText = mockFormattedVoiceRich();

const THEME_TOKENS = {
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};

const DEFAULT_THEME_TOKENS = {
  accentHue: 200,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
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
      await StandaloneNotFoundPage({ tenant: MOCK_TENANT_ID });

      expect(getThemeTokensMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(resolveTenantMessagesMock).toHaveBeenCalledWith(
        messages,
        LOCALE_ISO_CODES.EN,
        MOCK_TENANT_ID,
      );
      expect(toThemeTokensMock).not.toHaveBeenCalled();
    });

    it('passes the resolved theme tokens through to ThemeScope', async () => {
      const ui = await StandaloneNotFoundPage({ tenant: MOCK_TENANT_ID });

      expect(ui.type).toBe(ThemeScope);
      expect(ui.props.themeTokens).toBe(THEME_TOKENS);
    });

    it('resolves the tenant’s messages in the given language', async () => {
      await StandaloneNotFoundPage({
        tenant: MOCK_TENANT_ID,
        locale: LOCALE_ISO_CODES.NL,
      });

      expect(resolveTenantMessagesMock).toHaveBeenCalledWith(
        SITE_MESSAGES_BY_LOCALE.NL,
        LOCALE_ISO_CODES.NL,
        MOCK_TENANT_ID,
      );
    });

    it('wraps NotFoundPage in its own intl provider with the voiced messages', async () => {
      const ui = await StandaloneNotFoundPage({ tenant: MOCK_TENANT_ID });
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
