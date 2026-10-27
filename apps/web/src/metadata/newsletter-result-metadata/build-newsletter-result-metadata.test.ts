import { NEWSLETTER_RESULT, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { NOINDEX_ROBOTS } from '@web/testing/metadata/to-metadata/fixtures';

import { buildNewsletterResultMetadata } from './build-newsletter-result-metadata';

const { successTitle } = SITE_MESSAGES_BY_LOCALE.EN.newsletterUnsubscribe;

describe(buildNewsletterResultMetadata, () => {
  it('titles the page with its result and keeps it out of search', async () => {
    const metadata = await buildNewsletterResultMetadata(
      NEWSLETTER_RESULT.UNSUBSCRIBED,
    );

    expect(metadata).toEqual({
      title: successTitle,
      robots: NOINDEX_ROBOTS,
    });
  });
});
