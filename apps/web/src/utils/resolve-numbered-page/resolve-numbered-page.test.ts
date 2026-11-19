import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { permanentRedirect } from '@web/i18n/navigation';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import {
  resolveNumberedPage,
  toNumberedMetadataPage,
} from './resolve-numbered-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

faker.seed(7645);

const MOCK_FIRST_PAGE_HREF = `/${faker.lorem.slug(2)}`;
const MOCK_PAGE = faker.number.int({ min: 2, max: 999 });
const MOCK_FIRST_PAGE = '1';
const MOCK_NON_CANONICAL_PAGES = ['abc', '02'];

describe(resolveNumberedPage, () => {
  it('returns a page past the first', async () => {
    const page = await resolveNumberedPage(
      String(MOCK_PAGE),
      MOCK_FIRST_PAGE_HREF,
    );

    expect(page).toBe(MOCK_PAGE);
    expect(permanentRedirect).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('permanently redirects page 1 to the first-page href in the request language', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });

    await expect(
      resolveNumberedPage(MOCK_FIRST_PAGE, MOCK_FIRST_PAGE_HREF),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(permanentRedirect).toHaveBeenCalledWith({
      href: MOCK_FIRST_PAGE_HREF,
      locale: LOCALE_ISO_CODES.NL,
    });
  });

  it.each(MOCK_NON_CANONICAL_PAGES)(
    'hard-404s a non-canonical page param (%s)',
    async (rawPage) => {
      await expect(
        resolveNumberedPage(rawPage, MOCK_FIRST_PAGE_HREF),
      ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

      expect(notFound).toHaveBeenCalledTimes(1);
      expect(permanentRedirect).not.toHaveBeenCalled();
    },
  );
});

describe(toNumberedMetadataPage, () => {
  it('returns the page number for a page past the first', () => {
    expect(toNumberedMetadataPage(String(MOCK_PAGE))).toBe(MOCK_PAGE);
  });

  it.each([MOCK_FIRST_PAGE, ...MOCK_NON_CANONICAL_PAGES])(
    'returns null for page param %s',
    (rawPage) => {
      expect(toNumberedMetadataPage(rawPage)).toBeNull();
    },
  );
});
