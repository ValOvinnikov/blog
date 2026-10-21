import { buildNewsletterUnsubscribeMetadata } from './build-newsletter-unsubscribe-metadata';

describe(buildNewsletterUnsubscribeMetadata, () => {
  it('titles the page with the confirm prompt and keeps it out of search', async () => {
    const metadata = await buildNewsletterUnsubscribeMetadata();

    expect(metadata.title).toBe('Unsubscribe from our newsletter');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
