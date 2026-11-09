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
const { ariaLabel, cookies, intro, analyticsNote } = SITE_MESSAGES.cookieList;

const getCookieRow = (name: string) =>
  screen.getByRole('row', {
    name: (accessibleName) => accessibleName.startsWith(`${name} `),
  });

const getStackedEntries = () =>
  within(screen.getByRole('list', { name: ariaLabel })).getAllByRole(
    'listitem',
  );

describe(`<${CookieList.name}/>`, () => {
  it.each(COOKIE_LIST)(
    'lists $name in the table with its purpose and duration',
    ({ id, name }) => {
      renderElement(<CookieList />);

      const row = within(getCookieRow(name));
      const { purpose, duration } = cookies[id];
      expect(row.getByText(purpose)).toBeVisible();
      expect(row.getByText(duration)).toBeVisible();
    },
  );

  it.each(COOKIE_LIST.map((entry, index) => ({ ...entry, index })))(
    'stacks $name with its purpose and duration',
    ({ id, name, index }) => {
      renderElement(<CookieList />);

      const entry = getStackedEntries()[index];
      const { purpose, duration } = cookies[id];
      expect(entry).toHaveTextContent(name);
      expect(entry).toHaveTextContent(purpose);
      expect(entry).toHaveTextContent(duration);
    },
  );

  it('says every item is set by this site and strictly necessary', () => {
    renderElement(<CookieList />);

    const sentence = screen.getByText(intro);
    expect(sentence).toBeVisible();
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

    const table = screen.getByRole('region', {
      name: NL_MESSAGES.cookieList.ariaLabel,
    });
    const sentence = screen.getByText(NL_MESSAGES.cookieList.intro);
    const row = within(getCookieRow(LANGUAGE_COOKIE_NAME));
    expect(table).toBeVisible();
    expect(sentence).toBeVisible();
    expect(
      row.getByText(NL_MESSAGES.cookieList.cookies[COOKIE_ID.LANGUAGE].purpose),
    ).toBeVisible();
  });

  it('shows the analytics note below the list', () => {
    renderElement(<CookieList />);

    const note = screen.getByText(analyticsNote);
    expect(note).toBeVisible();
  });
});
