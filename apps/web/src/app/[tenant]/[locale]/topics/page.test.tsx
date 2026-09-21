import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';

import TopicIndexRoutePage, { generateMetadata, revalidate } from './page';

vi.mock('@web/metadata/topic-index-metadata', () => ({
  buildTopicIndexMetadata: vi.fn().mockResolvedValue({ title: 'Topics' }),
}));

vi.mock('@web/components/pages/topic-index-page', () => ({
  TopicIndexPage: ({ locale, tenant }: { locale: string; tenant: string }) => (
    <div data-testid="topic-index-page">
      {locale}:{tenant}
    </div>
  ),
}));

describe('TopicIndexRoutePage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  describe('generateMetadata', () => {
    it('delegates to buildTopicIndexMetadata with the resolved tenant', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
      });

      expect(metadata).toEqual({ title: 'Topics' });
    });
  });

  it('renders TopicIndexPage with the resolved locale and tenant', async () => {
    const ui = await TopicIndexRoutePage({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
    });

    expect(ui.props.locale).toBe('EN');
    expect(ui.props.tenant).toBe('tenant-1');
  });
});
