import { customRenderAsync } from '@web/testing/custom-render';
import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@web/utils/content-route-revalidate-seconds';
import { notFound } from 'next/navigation';

import BlogListNumberedPage, { revalidate } from './page';

const { permanentRedirectMock } = vi.hoisted(() => ({
  permanentRedirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { getIndexPageMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
}));

// Isolates the redirect/404 branch — neither tested path (page 1 redirect,
// non-canonical hard-404) should ever reach the real service/fetch chain.
vi.mock('@blog/service', () => ({
  service: {
    pages: {
      blog: { v1: { getIndexPage: getIndexPageMock } },
    },
  },
}));

vi.mock('@web/i18n/navigation', () => ({
  permanentRedirect: permanentRedirectMock,
}));

const setup = customRenderAsync(BlogListNumberedPage, {
  params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN', page: '1' }),
});

describe('BlogListNumberedPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  beforeEach(() => {
    permanentRedirectMock.mockClear();
  });

  it('redirects /blog/page/1 to /blog (canonical page 1 has one URL)', async () => {
    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(permanentRedirectMock).toHaveBeenCalledWith({
      href: '/blog',
      locale: 'EN',
    });
  });

  it.each(['abc', '02'])(
    'hard-404s a non-canonical page param (%s)',
    async (raw) => {
      await expect(
        setup({
          params: Promise.resolve({
            tenant: 'tenant-1',
            locale: 'EN',
            page: raw,
          }),
        }),
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalled();
    },
  );
});
