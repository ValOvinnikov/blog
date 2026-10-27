import {
  LOCALE_ISO_CODES,
  SITE_MESSAGES_BY_LOCALE,
  type TSiteMessages,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import {
  MOCK_VOICE_LINK_HREF,
  MOCK_VOICE_LINK_TEXT,
  mockFormattedVoiceRich,
} from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';
import { toThemeTokens } from '@web/utils/to-theme-tokens';
import { setRequestLocale } from 'next-intl/server';

import { StandaloneNotFoundPage } from './standalone-not-found-page';

const { getThemeTokensMock, resolveTenantMessagesMock } = vi.hoisted(() => ({
  getThemeTokensMock: vi.fn(),
  resolveTenantMessagesMock: vi.fn(),
}));

vi.mock('@web/utils/get-theme-tokens', () => ({
  getThemeTokens: getThemeTokensMock,
}));

vi.mock('@web/utils/resolve-tenant-messages', () => ({
  resolveTenantMessages: resolveTenantMessagesMock,
}));

faker.seed(6008);

const { EN, NL } = LOCALE_ISO_CODES;
const EN_MESSAGES = SITE_MESSAGES_BY_LOCALE.EN;
const NL_MESSAGES = SITE_MESSAGES_BY_LOCALE.NL;
const MOCK_VOICED_HEADING = faker.lorem.words(3);
const MOCK_VOICED_MESSAGES: TSiteMessages = {
  ...EN_MESSAGES,
  notFound: { ...EN_MESSAGES.notFound, heading: MOCK_VOICED_HEADING },
};

const setup = customRenderAsync(StandaloneNotFoundPage, {});

describe(`<${StandaloneNotFoundPage.name}/>`, () => {
  beforeEach(() => {
    getThemeTokensMock.mockResolvedValue(toThemeTokens(undefined));
    resolveTenantMessagesMock.mockResolvedValue({
      messages: MOCK_VOICED_MESSAGES,
      rich: {
        ...resolveVoiceRichFields({}, EN_MESSAGES),
        notFoundSupportingText: mockFormattedVoiceRich(),
      },
    });
  });

  it('renders in English by default', async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: EN_MESSAGES.notFound.heading,
    });

    expect(vi.mocked(setRequestLocale)).toHaveBeenCalledWith(EN);
    expect(heading).toBeVisible();
  });

  it('renders in the given language with its messages', async () => {
    await setup({ locale: NL });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: NL_MESSAGES.notFound.heading,
    });

    expect(vi.mocked(setRequestLocale)).toHaveBeenCalledWith(NL);
    expect(heading).toBeVisible();
  });

  describe('given a tenant', () => {
    it('resolves theme tokens and messages with that tenant', async () => {
      await setup({ tenant: MOCK_TENANT_ID });

      expect(getThemeTokensMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(resolveTenantMessagesMock).toHaveBeenCalledWith(
        EN_MESSAGES,
        EN,
        MOCK_TENANT_ID,
      );
    });

    it('resolves the tenant messages in the given language', async () => {
      await setup({ tenant: MOCK_TENANT_ID, locale: NL });

      expect(resolveTenantMessagesMock).toHaveBeenCalledWith(
        NL_MESSAGES,
        NL,
        MOCK_TENANT_ID,
      );
    });

    it('renders the tenant-voiced heading and supporting text', async () => {
      await setup({ tenant: MOCK_TENANT_ID });

      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_VOICED_HEADING,
      });
      const link = screen.getByRole('link', { name: MOCK_VOICE_LINK_TEXT });

      expect(heading).toBeVisible();
      expect(link).toHaveAttribute('href', MOCK_VOICE_LINK_HREF);
    });
  });

  describe('given no tenant', () => {
    it('never resolves theme tokens or tenant messages', async () => {
      await setup();

      expect(getThemeTokensMock).not.toHaveBeenCalled();
      expect(resolveTenantMessagesMock).not.toHaveBeenCalled();
    });

    it('renders the base, un-voiced copy', async () => {
      await setup();

      const supportingText = screen.getByText(
        EN_MESSAGES.notFound.supportingText,
      );
      const voicedHeading = screen.queryByRole('heading', {
        name: MOCK_VOICED_HEADING,
      });

      expect(supportingText).toBeVisible();
      expect(voicedHeading).not.toBeInTheDocument();
    });
  });
});
