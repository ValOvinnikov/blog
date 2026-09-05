import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';

import GenericSlugPage, { generateMetadata, revalidate } from './page';

vi.mock('@web/metadata/generic-page-metadata', () => ({
  buildGenericPageMetadata: vi.fn().mockResolvedValue({ title: 'About Us' }),
}));

vi.mock('@web/components/pages/generic-page', () => ({
  GenericPage: ({ slug, locale }: { slug: string; locale: string }) => (
    <div data-testid="generic-page">
      {slug}-{locale}
    </div>
  ),
}));

describe('GenericSlugPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  describe('generateMetadata', () => {
    it('delegates to buildGenericPageMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: 'about-us',
        }),
      });

      expect(metadata).toEqual({ title: 'About Us' });
    });
  });

  it('renders GenericPage with the resolved locale and slug', async () => {
    const ui = await GenericSlugPage({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: 'EN',
        slug: 'about-us',
      }),
    });

    expect(ui.props.slug).toBe('about-us');
    expect(ui.props.locale).toBe('EN');
  });
});
