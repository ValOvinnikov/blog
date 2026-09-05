import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';

import TopicsIndexPage, { generateMetadata, revalidate } from './page';

vi.mock('@web/metadata/topics-metadata', () => ({
  buildTopicsMetadata: vi.fn().mockResolvedValue({ title: 'Topics' }),
}));

vi.mock('@web/components/pages/topics-page', () => ({
  TopicsPage: ({ tenant }: { tenant: string }) => (
    <div data-testid="topics-page">{tenant}</div>
  ),
}));

describe('TopicsIndexPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  describe('generateMetadata', () => {
    it('delegates to buildTopicsMetadata with the resolved tenant', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
      });

      expect(metadata).toEqual({ title: 'Topics' });
    });
  });

  it('renders TopicsPage with the resolved tenant', async () => {
    const ui = await TopicsIndexPage({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
    });

    expect(ui.props.tenant).toBe('tenant-1');
  });
});
