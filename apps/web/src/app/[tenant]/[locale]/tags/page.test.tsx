import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@web/utils/content-route-revalidate-seconds';

import TagsIndexPage, { generateMetadata, revalidate } from './page';

vi.mock('@web/metadata/tags-metadata', () => ({
  buildTagsMetadata: vi.fn().mockResolvedValue({ title: 'Tags' }),
}));

vi.mock('@web/components/pages/tags-page', () => ({
  TagsPage: ({ tenant }: { tenant: string }) => (
    <div data-testid="tags-page">{tenant}</div>
  ),
}));

describe('TagsIndexPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  describe('generateMetadata', () => {
    it('delegates to buildTagsMetadata with the resolved tenant', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
      });

      expect(metadata).toEqual({ title: 'Tags' });
    });
  });

  it('renders TagsPage with the resolved tenant', async () => {
    const ui = await TagsIndexPage({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
    });

    expect(ui.props.tenant).toBe('tenant-1');
  });
});
