import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  portableTextToPlainText,
  SITE_MESSAGES_BY_LOCALE,
  type TLocaleIsoCode,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { useVoiceRich } from '@web/context/voice-rich-provider';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
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

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

vi.mock('@blog/service', () => ({
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

const CONSENT_BANNER_HEADING = 'Cookies on this site';

const LocaleProbe = () => <p>{useLocale()}</p>;
const EmptyMessageProbe = () => (
  <p>{useTranslations('blogListPage')('empty')}</p>
);
const TimeZoneProbe = () => <p>{useTimeZone()}</p>;
const NowProbe = () => <p>{useNow().toISOString()}</p>;
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

  it('renders its children', async () => {
    await setup();

    const child = screen.getByText(MOCK_CHILD_TEXT);

    expect(child).toBeVisible();
  });

  it('provides the request locale', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });

    await setup({ children: <LocaleProbe /> });

    const locale = screen.getByText(LOCALE_ISO_CODES.NL);
    expect(locale).toBeVisible();
  });

  it("provides that locale's messages", async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });

    await setup({ children: <EmptyMessageProbe /> });

    const message = screen.getByText(
      SITE_MESSAGES_BY_LOCALE.NL.blogListPage.empty,
    );
    expect(message).toBeVisible();
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

  it('applies the tenant voice pack to the messages', async () => {
    mockVoiceOverrides(LOCALE_ISO_CODES.EN);

    await setup({ children: <EmptyMessageProbe /> });

    const message = screen.getByText(MOCK_VOICE_TEXT);
    expect(getSiteConfig).toHaveBeenCalledWith(MOCK_REQUEST_CONTEXT.tenantId);
    expect(message).toBeVisible();
  });

  it('applies the tenant voice pack saved for another language', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });
    mockVoiceOverrides(LOCALE_ISO_CODES.NL);

    await setup({ children: <EmptyMessageProbe /> });

    const message = screen.getByText(MOCK_VOICE_TEXT);
    expect(message).toBeVisible();
  });

  it('provides the rich voice values to descendants', async () => {
    mockVoiceOverrides(LOCALE_ISO_CODES.EN);

    await setup({ children: <RichVoiceProbe /> });

    const richText = screen.getByText(MOCK_VOICE_TEXT);
    expect(richText).toBeVisible();
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

  it('omits the consent banner when the capability is disabled', async () => {
    await setup();

    const heading = screen.queryByRole('heading', {
      name: CONSENT_BANNER_HEADING,
    });

    expect(heading).not.toBeInTheDocument();
  });
});
