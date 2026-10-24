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
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import {
  mockTopic,
  mockTopicDetailPage,
} from '@web/testing/shared/topic/fixtures';
import { notFound } from 'next/navigation';

import TopicNumberedPage, { generateMetadata, revalidate } from './page';

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      topic: {
        v1: {
          getTopicPage: getTopicPageMock,
        },
      },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const permanentRedirectMock = vi.mocked(permanentRedirect);

const SLUG = 'engineering';
const { title: TITLE } = mockTopic({ slug: SLUG });

const paramsFor = (page: string) =>
  Promise.resolve({
    tenant: MOCK_TENANT_ID,
    locale: LOCALE_ISO_CODES.EN,
    slug: SLUG,
    page,
  });

const setup = customRenderAsync(TopicNumberedPage, { params: paramsFor('1') });

describe('TopicNumberedPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  describe('generateMetadata', () => {
    it.each(['1', 'abc'])(
      'returns empty metadata without a fetch for page param %s',
      async (page) => {
        const metadata = await generateMetadata({ params: paramsFor(page) });

        expect(metadata).toEqual({});
        expect(getTopicPageMock).not.toHaveBeenCalled();
      },
    );

    it('builds metadata for page 2', async () => {
      getTopicPageMock.mockResolvedValue(okResult(mockTopicDetailPage()));

      const metadata = await generateMetadata({ params: paramsFor('2') });

      expect(metadata.title).toBe(`${TITLE} – Page 2`);
      expect(getTopicPageMock).toHaveBeenCalledWith(
        SLUG,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });
  });

  it('redirects page 1 to the canonical topic URL', async () => {
    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(enterRequestContext).toHaveBeenCalled();
    expect(permanentRedirectMock).toHaveBeenCalledWith({
      href: routes.topic(SLUG),
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
