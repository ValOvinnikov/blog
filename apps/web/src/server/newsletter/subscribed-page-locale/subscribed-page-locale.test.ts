import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { getLocale } from 'next-intl/server';

import { getSubscribedPageLocale } from './subscribed-page-locale';

faker.seed(6010);

const MOCK_UNSUPPORTED_LOCALE = faker.string.alpha(8);

describe(getSubscribedPageLocale, () => {
  it('returns the language of the page the reader is on', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce(LOCALE_ISO_CODES.FR);

    const locale = await getSubscribedPageLocale();

    expect(locale).toBe(LOCALE_ISO_CODES.FR);
  });

  it('returns nothing when the page language is not a site language', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce(MOCK_UNSUPPORTED_LOCALE);

    const locale = await getSubscribedPageLocale();

    expect(locale).toBeUndefined();
  });
});
