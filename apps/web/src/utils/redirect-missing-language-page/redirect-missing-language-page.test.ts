import { LOCALE_ISO_CODES } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { redirect } from 'next/navigation';

import { redirectMissingLanguagePage } from './redirect-missing-language-page';

vi.mock('@web/server/request-context/request-context');

const { EN, NL } = LOCALE_ISO_CODES;

const inLanguage = (locale: typeof EN | typeof NL) => {
  vi.mocked(getRequestContext).mockResolvedValue({
    ...DEFAULT_REQUEST_CONTEXT,
    locale,
    defaultLocale: EN,
    liveLocales: [EN, NL],
  });
};

describe(redirectMissingLanguagePage, () => {
  it('redirects to / when a non-default language has no page of its own', async () => {
    inLanguage(NL);

    await expect(
      redirectMissingLanguagePage({ ok: true, data: undefined }),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('does not redirect when the default language has no page', async () => {
    inLanguage(EN);

    await redirectMissingLanguagePage({ ok: true, data: undefined });

    expect(redirect).not.toHaveBeenCalled();
  });

  it('does not redirect when the language has its page', async () => {
    inLanguage(NL);

    await redirectMissingLanguagePage({ ok: true, data: { title: 'Blog' } });

    expect(redirect).not.toHaveBeenCalled();
  });

  it('does not redirect when the fetch failed', async () => {
    inLanguage(NL);

    await redirectMissingLanguagePage({ ok: false, error: new Error('boom') });

    expect(redirect).not.toHaveBeenCalled();
  });
});
