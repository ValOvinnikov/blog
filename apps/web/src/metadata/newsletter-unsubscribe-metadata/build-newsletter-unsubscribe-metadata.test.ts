import { SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { NOINDEX_ROBOTS } from '@web/testing/metadata/to-metadata/fixtures';

import { buildNewsletterUnsubscribeMetadata } from './build-newsletter-unsubscribe-metadata';

const { confirmTitle } = SITE_MESSAGES_BY_LOCALE.EN.newsletterUnsubscribe;

describe(buildNewsletterUnsubscribeMetadata, () => {
  it('titles the page with the confirm prompt and keeps it out of search', async () => {
    const metadata = await buildNewsletterUnsubscribeMetadata();

    expect(metadata).toEqual({ title: confirmTitle, robots: NOINDEX_ROBOTS });
  });
});
