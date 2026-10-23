import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@blog/config';
import { okResult } from '@blog/utils';
import { permanentRedirect } from '@web/i18n/navigation';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync } from '@web/testing/custom-render';
import { mockTag, mockTagDetailPage } from '@web/testing/shared/tag/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import TagNumberedPage, { generateMetadata, revalidate } from './page';

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tag: {
        v1: {
          getTagPage: getTagPageMock,
        },
      },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const permanentRedirectMock = vi.mocked(permanentRedirect);

const SLUG = 'typescript';
const { title: TITLE } = mockTag({ slug: SLUG });

const paramsFor = (page: string) =>
  Promise.resolve({
    tenant: MOCK_TENANT_ID,
    locale: LOCALE_ISO_CODES.EN,
    slug: SLUG,
    page,
  });

const setup = customRenderAsync(TagNumberedPage, { params: paramsFor('1') });

describe('TagNumberedPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  describe('generateMetadata', () => {
    it.each(['1', 'abc'])(
      'returns empty metadata without a fetch for page param %s',
      async (page) => {
        const metadata = await generateMetadata({ params: paramsFor(page) });

        expect(metadata).toEqual({});
        expect(getTagPageMock).not.toHaveBeenCalled();
      },
    );

    it('builds metadata for page 2', async () => {
      getTagPageMock.mockResolvedValue(okResult(mockTagDetailPage()));

      const metadata = await generateMetadata({ params: paramsFor('2') });

      expect(metadata.title).toBe(`${TITLE} – Page 2`);
      expect(getTagPageMock).toHaveBeenCalledWith(
        SLUG,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });
  });

  it('redirects page 1 to the canonical tag URL', async () => {
    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(enterRequestContext).toHaveBeenCalled();
    expect(permanentRedirectMock).toHaveBeenCalledWith({
      href: routes.tag(SLUG),
      locale: LOCALE_ISO_CODES.EN,
    });
  });

  it.each(['abc', '02'])(
    'hard-404s a non-canonical page param (%s)',
    async (raw) => {
      await expect(setup({ params: paramsFor(raw) })).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalled();
    },
  );
});
