import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { permanentRedirect } from '@web/i18n/navigation';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import PostIndexNumberedPage, { revalidate } from './page';

const { getIndexPageMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      blog: { v1: { getIndexPage: getIndexPageMock } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const setup = customRenderAsync(PostIndexNumberedPage, {
  params: Promise.resolve({
    tenant: 'tenant-1',
    locale: LOCALE_ISO_CODES.EN,
    page: '1',
  }),
});

describe('PostIndexNumberedPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('redirects /blog/page/1 to /blog (canonical page 1 has one URL)', async () => {
    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(enterRequestContext).toHaveBeenCalled();

    expect(permanentRedirect).toHaveBeenCalledWith({
      href: '/blog',
      locale: LOCALE_ISO_CODES.EN,
    });
  });

  it.each(['abc', '02'])(
    'hard-404s a non-canonical page param (%s)',
    async (raw) => {
      await expect(
        setup({
          params: Promise.resolve({
            tenant: 'tenant-1',
            locale: LOCALE_ISO_CODES.EN,
            page: raw,
          }),
        }),
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalled();
    },
  );
});
