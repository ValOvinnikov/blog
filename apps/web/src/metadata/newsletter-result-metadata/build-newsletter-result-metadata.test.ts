import { buildNewsletterResultMetadata } from './build-newsletter-result-metadata';

describe(buildNewsletterResultMetadata, () => {
  it('titles the page with its result and keeps it out of search', async () => {
    const metadata = await buildNewsletterResultMetadata('UNSUBSCRIBED');

    expect(metadata.title).toBe("You're unsubscribed");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
