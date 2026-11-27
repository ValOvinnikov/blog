import { faker } from '@faker-js/faker';
import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  portableTextToPlainText,
  routes,
  SITE_MESSAGES_BY_LOCALE,
  type TLocaleIsoCode,
} from '@shinefold/config';
import { MOCK_PLAUSIBLE_ANALYTICS } from '@shinefold/db/testing/tenant-analytics/fixtures';
import { SmartLink } from '@web/components/shared/smart-link';
import { useSiteAnalytics } from '@web/context/site-analytics-provider';
import { useVoiceRich } from '@web/context/voice-rich-provider';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { getSiteAnalytics } from '@web/server/site-config/get-site-analytics/get-site-analytics';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { clearConsentCookie } from '@web/testing/shared/consent/consent-cookie';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockVoiceRichText } from '@web/testing/shared/voice/fixtures';
import { useLocale, useNow, useTimeZone, useTranslations } from 'next-intl';
import { getNow, getTimeZone } from 'next-intl/server';

import { SiteProviders } from './site-providers';

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({ isCapabilityEnabled: vi.fn() }),
);

vi.mock('@web/server/site-config/get-busy-style/get-busy-style');

vi.mock('@web/server/site-config/get-site-analytics/get-site-analytics');

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

vi.mock('@shinefold/service', () => ({
  getSanityImageBaseUrl: () => 'https://cdn.sanity.io/images/p/d/',
}));

vi.mock('next-intl/server', () => ({
  getNow: vi.fn(),
  getTimeZone: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: unknown }) => children,
}));

faker.seed(6007);

const MOCK_CHILD_TEXT = faker.lorem.sentence();
const MOCK_VOICE_TEXT = faker.lorem.sentence();
const MOCK_NOW = faker.date.past();
const MOCK_TIME_ZONE = faker.location.timeZone();
const MOCK_LINK_LABEL = faker.lorem.words(2);

const CONSENT_BANNER_HEADING = 'Cookies on this site';

const LocaleProbe = () => <p>{useLocale()}</p>;
const EmptyMessageProbe = () => (
  <p>{useTranslations('blogListPage')('empty')}</p>
);
const TimeZoneProbe = () => <p>{useTimeZone()}</p>;
const NowProbe = () => <p>{useNow().toISOString()}</p>;
const AnalyticsProbe = () => <p>{useSiteAnalytics()?.analyticsId}</p>;
const RichVoiceProbe = () => (
  <p>{portableTextToPlainText(useVoiceRich('blogListEmpty'))}</p>
);

const mockVoiceOverrides = (locale: TLocaleIsoCode) => {
  vi.mocked(getSiteConfig).mockResolvedValue({
    ok: true,
    data: {
      voiceOverridesByLocale: {
        [locale]: { blogListEmpty: mockVoiceRichText(MOCK_VOICE_TEXT) },
      },
    },
  } as never);
};

const setup = customRenderAsync(SiteProviders, {
  children: <p>{MOCK_CHILD_TEXT}</p>,
});

describe(SiteProviders, () => {
  beforeEach(() => {
    clearConsentCookie();
    vi.mocked(getNow).mockResolvedValue(MOCK_NOW);
    vi.mocked(getTimeZone).mockResolvedValue(MOCK_TIME_ZONE);
    vi.mocked(isCapabilityEnabled).mockResolvedValue(false);
    vi.mocked(getSiteConfig).mockResolvedValue({
      ok: true,
      data: undefined,
    } as never);
  });

  afterEach(clearConsentCookie);

  describe('with the consent banner off', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders its children', () => {
      const child = screen.getByText(MOCK_CHILD_TEXT);

      expect(child).toBeVisible();
    });

    it('omits the consent banner', () => {
      const heading = screen.queryByRole('heading', {
        name: CONSENT_BANNER_HEADING,
      });

      expect(heading).not.toBeInTheDocument();
    });
  });

  describe('for a Dutch request', () => {
    beforeEach(() => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        locale: LOCALE_ISO_CODES.NL,
      });
    });

    it('provides the request locale', async () => {
      await setup({ children: <LocaleProbe /> });

      const locale = screen.getByText(LOCALE_ISO_CODES.NL);
      expect(locale).toBeVisible();
    });

    it("provides that locale's messages", async () => {
      await setup({ children: <EmptyMessageProbe /> });

      const message = screen.getByText(
        SITE_MESSAGES_BY_LOCALE.NL.blogListPage.empty,
      );
      expect(message).toBeVisible();
    });

    it('applies the tenant voice pack saved for that language', async () => {
      mockVoiceOverrides(LOCALE_ISO_CODES.NL);

      await setup({ children: <EmptyMessageProbe /> });

      const message = screen.getByText(MOCK_VOICE_TEXT);
      expect(message).toBeVisible();
    });
  });

  it("links a Dutch-default tenant's Dutch pages without a prefix", async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      defaultLocale: LOCALE_ISO_CODES.NL,
    });

    await setup({
      children: (
        <SmartLink href={routes.blogIndex()}>{MOCK_LINK_LABEL}</SmartLink>
      ),
    });

    const link = screen.getByRole('link', { name: MOCK_LINK_LABEL });
    expect(link).toHaveAttribute('href', routes.blogIndex());
  });

  it('provides the request time zone', async () => {
    await setup({ children: <TimeZoneProbe /> });

    const timeZone = screen.getByText(MOCK_TIME_ZONE);

    expect(timeZone).toBeVisible();
  });

  it('provides the request time', async () => {
    await setup({ children: <NowProbe /> });

    const now = screen.getByText(MOCK_NOW.toISOString());

    expect(now).toBeVisible();
  });

  describe('with an English voice pack', () => {
    beforeEach(() => {
      mockVoiceOverrides(LOCALE_ISO_CODES.EN);
    });

    it('applies it to the messages', async () => {
      await setup({ children: <EmptyMessageProbe /> });

      const message = screen.getByText(MOCK_VOICE_TEXT);
      expect(getSiteConfig).toHaveBeenCalledWith(MOCK_REQUEST_CONTEXT.tenantId);
      expect(message).toBeVisible();
    });

    it('provides the rich voice values to descendants', async () => {
      await setup({ children: <RichVoiceProbe /> });

      const richText = screen.getByText(MOCK_VOICE_TEXT);
      expect(richText).toBeVisible();
    });
  });

  it("provides the tenant's analytics tool to descendants", async () => {
    vi.mocked(getSiteAnalytics).mockResolvedValueOnce(MOCK_PLAUSIBLE_ANALYTICS);

    await setup({ children: <AnalyticsProbe /> });

    const analyticsId = screen.getByText(MOCK_PLAUSIBLE_ANALYTICS.analyticsId);
    expect(getSiteAnalytics).toHaveBeenCalledWith(
      MOCK_REQUEST_CONTEXT.tenantId,
    );
    expect(analyticsId).toBeVisible();
  });

  it('shows the consent banner when the capability is enabled', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValue(true);

    await setup();

    const heading = screen.getByRole('heading', {
      name: CONSENT_BANNER_HEADING,
    });
    expect(isCapabilityEnabled).toHaveBeenCalledWith(CAPABILITY.CONSENT_BANNER);
    expect(heading).toBeVisible();
  });
});
