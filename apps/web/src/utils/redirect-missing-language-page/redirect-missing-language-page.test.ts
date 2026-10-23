import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { redirect } from 'next/navigation';

import { redirectMissingLanguagePage } from './redirect-missing-language-page';

vi.mock('@web/server/request-context/request-context');

const { EN, NL } = LOCALE_ISO_CODES;

const inLanguage = (locale: typeof EN | typeof NL) => {
  vi.mocked(getRequestContext).mockResolvedValue({
    ...MOCK_REQUEST_CONTEXT,
    locale,
    defaultLocale: EN,
    liveLocales: [EN, NL],
  });
};

describe(redirectMissingLanguagePage, () => {
  beforeEach(() => {
    inLanguage(NL);
  });

  it('redirects to / when a non-default language has no page of its own', async () => {
    await expect(redirectMissingLanguagePage(okResult())).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it.each([
    {
      case: 'the default language has no page',
      locale: EN,
      result: okResult(),
    },
    { case: 'the language has its page', locale: NL, result: okResult({}) },
    { case: 'the fetch failed', locale: NL, result: errorResult(MOCK_ERROR) },
  ])('does not redirect when $case', async ({ locale, result }) => {
    inLanguage(locale);

    await redirectMissingLanguagePage(result);

    expect(redirect).not.toHaveBeenCalled();
  });
});
