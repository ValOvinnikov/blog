import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { enterRequestContext } from '@web/server/request-context/request-context';

import TagDetailPage, { generateMetadata, revalidate } from './page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/components/pages/tag-page', () => ({
  TagPage: ({ slug }: { slug: string }) => (
    <div data-testid="tag-page">{slug}</div>
  ),
}));

vi.mock('@web/metadata/tag-metadata', () => ({
  buildTagMetadata: vi.fn().mockResolvedValue({ title: 'TypeScript' }),
}));

describe('TagDetailPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', async () => {
    const params = Promise.resolve({
      tenant: 'tenant-1',
      locale: LOCALE_ISO_CODES.EN,
      slug: 'a-slug',
    });

    await TagDetailPage({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  describe('generateMetadata', () => {
    it('delegates to buildTagMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: 'typescript',
        }),
      });

      expect(metadata).toEqual({ title: 'TypeScript' });
    });

    it('enters the request context with the route params', async () => {
      const params: Parameters<typeof generateMetadata>[0]['params'] =
        Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: 'typescript',
        });

      await generateMetadata({ params });

      expect(enterRequestContext).toHaveBeenCalledWith(params);
    });
  });

  it('renders TagPage with the resolved slug', async () => {
    const ui = await TagDetailPage({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: 'EN',
        slug: 'typescript',
      }),
    });

    expect(ui.props.slug).toBe('typescript');
  });
});
