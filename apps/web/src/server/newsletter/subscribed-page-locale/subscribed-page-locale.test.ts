import { getLocale } from 'next-intl/server';

import { getSubscribedPageLocale } from './subscribed-page-locale';

describe(getSubscribedPageLocale, () => {
  it('returns the language of the page the reader is on', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce('FR');

    await expect(getSubscribedPageLocale()).resolves.toBe('FR');
  });

  it('returns nothing when the page language is not a site language', async () => {
    vi.mocked(getLocale).mockResolvedValueOnce('xx');

    await expect(getSubscribedPageLocale()).resolves.toBeUndefined();
  });
});
