import {
  LOCALE_ISO_CODES,
  SITE_MESSAGES,
  SITE_MESSAGES_BY_LOCALE,
} from '@shinefold/config';
import {
  MOCK_GOOGLE_ANALYTICS,
  MOCK_PLAUSIBLE_ANALYTICS,
} from '@shinefold/db/testing/tenant-analytics/fixtures';
import { COOKIE_ID, COOKIE_LIST } from '@web/constants/cookie-list';
import { renderElement, screen, within } from '@web/testing/custom-render';
import { withSiteAnalytics } from '@web/testing/shared/site-analytics/with-site-analytics';
import { LANGUAGE_COOKIE_NAME } from '@web/utils/language-cookie';
import { NextIntlClientProvider } from 'next-intl';

import { CookieList } from './cookie-list';

const NL_MESSAGES = SITE_MESSAGES_BY_LOCALE.NL;
const {
  ariaLabel,
  cookies,
  intro,
  introWithGoogleAnalytics,
  analyticsNote,
  plausibleNote,
} = SITE_MESSAGES.cookieList;

const GOOGLE_ANALYTICS_COOKIE = '_ga';
const MOCK_GOOGLE_ANALYTICS_VISIT_COOKIE = `${GOOGLE_ANALYTICS_COOKIE}_${MOCK_GOOGLE_ANALYTICS.analyticsId.replace(/^G-/, '')}`;

const getCookieRow = (name: string) =>
  screen.getByRole('row', {
    name: (accessibleName) => accessibleName.startsWith(`${name} `),
  });

const getStackedEntries = () =>
  within(screen.getByRole('list', { name: ariaLabel })).getAllByRole(
    'listitem',
  );

const expectRowWith = (name: string, purpose: string, duration: string) => {
  const row = within(getCookieRow(name));
  const purposeCell = row.getByText(purpose);
  const durationCell = row.getByText(duration);
  expect(purposeCell).toBeVisible();
  expect(durationCell).toBeVisible();
};

const itSaysNothingAboutPlausible = () =>
  it('says nothing about Plausible', () => {
    const note = screen.queryByText(plausibleNote);
    expect(note).not.toBeInTheDocument();
  });

describe(`<${CookieList.name}/>`, () => {
  describe('without an analytics tool', () => {
    beforeEach(() => {
      renderElement(<CookieList />);
    });

    it.each(COOKIE_LIST)(
      'lists $name in the table with its purpose and duration',
      ({ id, name }) => {
        const { purpose, duration } = cookies[id];
        expectRowWith(name, purpose, duration);
      },
    );

    it.each(COOKIE_LIST.map((entry, index) => ({ ...entry, index })))(
      'stacks $name with its purpose and duration',
      ({ id, name, index }) => {
        const entry = getStackedEntries()[index];
        const { purpose, duration } = cookies[id];
        expect(entry).toHaveTextContent(name);
        expect(entry).toHaveTextContent(purpose);
        expect(entry).toHaveTextContent(duration);
      },
    );

    it('says every item is set by this site and strictly necessary', () => {
      const sentence = screen.getByText(intro);
      expect(sentence).toBeVisible();
    });

    it('shows the analytics note below the list', () => {
      const note = screen.getByText(analyticsNote);
      expect(note).toBeVisible();
    });

    itSaysNothingAboutPlausible();
  });

  it('renders the list in the page language', () => {
    renderElement(
      <NextIntlClientProvider
        locale={LOCALE_ISO_CODES.NL}
        messages={NL_MESSAGES}
      >
        <CookieList />
      </NextIntlClientProvider>,
    );

    const {
      ariaLabel: nlAriaLabel,
      intro: nlIntro,
      cookies: nlCookies,
    } = NL_MESSAGES.cookieList;
    const table = screen.getByRole('region', { name: nlAriaLabel });
    const sentence = screen.getByText(nlIntro);
    const row = within(getCookieRow(LANGUAGE_COOKIE_NAME));
    const purpose = row.getByText(nlCookies[COOKIE_ID.LANGUAGE].purpose);
    expect(table).toBeVisible();
    expect(sentence).toBeVisible();
    expect(purpose).toBeVisible();
  });

  describe('with Google Analytics configured', () => {
    beforeEach(() => {
      renderElement(withSiteAnalytics(<CookieList />, MOCK_GOOGLE_ANALYTICS));
    });

    it.each([
      { name: GOOGLE_ANALYTICS_COOKIE, id: COOKIE_ID.GOOGLE_ANALYTICS },
      {
        name: MOCK_GOOGLE_ANALYTICS_VISIT_COOKIE,
        id: COOKIE_ID.GOOGLE_ANALYTICS_VISIT,
      },
    ])('lists $name with its purpose and duration', ({ name, id }) => {
      const { purpose, duration } = cookies[id];
      expectRowWith(name, purpose, duration);
    });

    it('says the Google Analytics cookies need the visitor to allow analytics', () => {
      const sentence = screen.getByText(introWithGoogleAnalytics);
      const necessaryOnlySentence = screen.queryByText(intro);
      expect(sentence).toBeVisible();
      expect(necessaryOnlySentence).not.toBeInTheDocument();
    });

    itSaysNothingAboutPlausible();
  });

  describe('with Plausible configured', () => {
    it('lists no Google cookie', () => {
      renderElement(
        withSiteAnalytics(<CookieList />, MOCK_PLAUSIBLE_ANALYTICS),
      );

      const entries = getStackedEntries();
      const sentence = screen.getByText(intro);
      expect(entries).toHaveLength(COOKIE_LIST.length);
      expect(sentence).toBeVisible();
    });

    it.each(Object.values(LOCALE_ISO_CODES))(
      'says the site measures visits with Plausible in %s',
      (locale) => {
        const messages = SITE_MESSAGES_BY_LOCALE[locale];
        renderElement(
          <NextIntlClientProvider locale={locale} messages={messages}>
            {withSiteAnalytics(<CookieList />, MOCK_PLAUSIBLE_ANALYTICS)}
          </NextIntlClientProvider>,
        );

        const note = screen.getByText(messages.cookieList.plausibleNote);
        expect(note).toBeVisible();
      },
    );
  });
});
