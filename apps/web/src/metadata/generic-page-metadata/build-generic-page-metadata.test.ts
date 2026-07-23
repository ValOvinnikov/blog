import { makeSeo } from '@web/testing/shared/seo/fixtures';

import { buildGenericPageMetadata } from './build-generic-page-metadata';

const { getPageMock } = vi.hoisted(() => ({
  getPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      generic: { v1: { getPage: getPageMock } },
    },
  },
}));

const seo = makeSeo({
  title: 'About Us',
  description: 'Who we are.',
  ogTitle: 'About Us OG',
  ogDescription: 'Who we are OG.',
  ogImageUrl: 'https://cdn.example.com/about-og.jpg',
});

describe('buildGenericPageMetadata', () => {
  it('maps the resolved seo straight through toMetadata, self-canonical to /[slug]', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: { title: 'About Us', slug: 'about-us', modules: [], seo },
    });

    const metadata = await buildGenericPageMetadata('about-us');

    expect(metadata.title).toBe('About Us');
    expect(metadata.description).toBe('Who we are.');
    expect(metadata.alternates?.canonical).toBe('/about-us');
    expect(metadata.openGraph?.title).toBe('About Us OG');
    expect(metadata.openGraph?.description).toBe('Who we are OG.');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/about-og.jpg' },
    ]);
  });

  it('returns empty metadata when the page fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const metadata = await buildGenericPageMetadata('missing');

    expect(metadata).toEqual({});
    errorSpy.mockRestore();
  });
});
