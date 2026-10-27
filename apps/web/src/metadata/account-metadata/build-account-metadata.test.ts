import { routes, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { NOINDEX_ROBOTS } from '@web/testing/metadata/to-metadata/fixtures';

import { buildAccountMetadata } from './build-account-metadata';

const { title, metaDescription } = SITE_MESSAGES_BY_LOCALE.EN.accountPage;

describe(buildAccountMetadata, () => {
  it('builds noindex metadata self-canonical to the account page', async () => {
    const metadata = await buildAccountMetadata();

    expect(metadata).toEqual({
      title,
      description: metaDescription,
      alternates: { canonical: routes.account() },
      robots: NOINDEX_ROBOTS,
    });
  });
});
