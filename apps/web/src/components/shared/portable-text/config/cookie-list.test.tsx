import {
  LOCALE_ISO_CODES,
  SITE_MESSAGES,
  SITE_MESSAGES_BY_LOCALE,
} from '@blog/config';
import { COOKIE_ID, COOKIE_LIST } from '@web/constants/cookie-list';
import { renderElement, screen, within } from '@web/testing/custom-render';
import { LANGUAGE_COOKIE_NAME } from '@web/utils/language-cookie';
import { NextIntlClientProvider } from 'next-intl';

import { CookieList } from './cookie-list';

const NL_MESSAGES = SITE_MESSAGES_BY_LOCALE.NL;

const getCookieRow = (name: string) =>
  screen.getByRole('row', {
    name: (accessibleName) => accessibleName.startsWith(`${name} `),
  });

describe(`<${CookieList.name}/>`, () => {
  it.each(COOKIE_LIST)(
    'lists $name with its provider, purpose, duration and category',
    ({ id, name }) => {
      renderElement(<CookieList />);

      const row = within(getCookieRow(name));
      const { purpose, duration } = SITE_MESSAGES.cookieList.cookies[id];
      expect(
        row.getByText(SITE_MESSAGES.cookieList.providers.site),
      ).toBeVisible();
      expect(row.getByText(purpose)).toBeVisible();
      expect(row.getByText(duration)).toBeVisible();
      expect(
        row.getByText(SITE_MESSAGES.consent.categories.necessary.label),
      ).toBeVisible();
    },
  );

  it('renders the list in the page language', () => {
    renderElement(
      <NextIntlClientProvider
        locale={LOCALE_ISO_CODES.NL}
        messages={NL_MESSAGES}
      >
        <CookieList />
      </NextIntlClientProvider>,
    );

    const table = screen.getByRole('region', {
      name: NL_MESSAGES.cookieList.ariaLabel,
    });
    const row = within(getCookieRow(LANGUAGE_COOKIE_NAME));
    expect(table).toBeVisible();
    expect(
      row.getByText(NL_MESSAGES.cookieList.cookies[COOKIE_ID.LANGUAGE].purpose),
    ).toBeVisible();
  });

  it('shows the analytics note below the list', () => {
    renderElement(<CookieList />);

    const note = screen.getByText(SITE_MESSAGES.cookieList.analyticsNote);
    expect(note).toBeVisible();
  });
});
