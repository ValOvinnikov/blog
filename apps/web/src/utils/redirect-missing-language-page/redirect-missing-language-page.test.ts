import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
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

  it('does not redirect when the default language has no page', async () => {
    inLanguage(EN);

    await redirectMissingLanguagePage(okResult());

    expect(redirect).not.toHaveBeenCalled();
  });

  it('does not redirect when the language has its page', async () => {
    await redirectMissingLanguagePage(okResult({ title: 'Blog' }));

    expect(redirect).not.toHaveBeenCalled();
  });

  it('does not redirect when the fetch failed', async () => {
    await redirectMissingLanguagePage(errorResult(new Error('boom')));

    expect(redirect).not.toHaveBeenCalled();
  });
});
