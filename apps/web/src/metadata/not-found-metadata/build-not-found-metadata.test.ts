import { LOCALE_ISO_CODES } from '@blog/config';
import { setRequestLocale } from 'next-intl/server';

import { buildNotFoundMetadata } from './build-not-found-metadata';

describe(buildNotFoundMetadata, () => {
  it('pins the request locale before reading translations', async () => {
    await buildNotFoundMetadata();

    expect(setRequestLocale).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
  });

  it('builds title and description from the notFound namespace', async () => {
    const metadata = await buildNotFoundMetadata();

    expect(metadata).toEqual({
      title: 'Page not found',
      description: "The page you're looking for doesn't exist.",
    });
  });
});
