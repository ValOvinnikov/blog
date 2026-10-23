import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { okResult } from '@blog/utils';
import { permanentRedirect } from '@web/i18n/navigation';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import TopicNumberedPage, { generateMetadata, revalidate } from './page';

const TOPIC_DESCRIPTION = 'Posts about building things.';

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

const setup = customRenderAsync(TopicNumberedPage, {
  params: Promise.resolve({
    tenant: 'tenant-1',
    locale: LOCALE_ISO_CODES.EN,
    slug: 'engineering',
    page: '1',
  }),
});

describe('TopicNumberedPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  beforeEach(() => {});

  describe('generateMetadata', () => {
    it('returns empty metadata for page 1', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
          slug: 'engineering',
          page: '1',
        }),
      });

      expect(metadata).toEqual({});
      expect(getTopicPageMock).not.toHaveBeenCalled();
    });

    it('returns empty metadata for a non-canonical page param', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
          slug: 'engineering',
          page: 'abc',
        }),
      });

      expect(metadata).toEqual({});
    });

    it('builds metadata for page 2', async () => {
      getTopicPageMock.mockResolvedValue(
        okResult({
          topic: {
            id: 'topic-1',
            title: 'Engineering',
            slug: 'engineering',
            description: TOPIC_DESCRIPTION,
          },
          modules: [],
          seo: {
            title: 'Engineering',
            description: TOPIC_DESCRIPTION,
            ogTitle: 'Engineering',
            ogDescription: TOPIC_DESCRIPTION,
            ogImage: undefined,
          },
        }),
      );

      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
          slug: 'engineering',
          page: '2',
        }),
      });

      expect(metadata.title).toBe('Engineering – Page 2');
      expect(getTopicPageMock).toHaveBeenCalledWith(
        'engineering',
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });
  });

  it('redirects /topics/[slug]/page/1 to /topics/[slug] (canonical page 1 has one URL)', async () => {
    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(enterRequestContext).toHaveBeenCalled();

    expect(permanentRedirectMock).toHaveBeenCalledWith({
      href: '/topics/engineering',
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
            slug: 'engineering',
            page: raw,
          }),
        }),
      ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

      expect(vi.mocked(notFound)).toHaveBeenCalled();
    },
  );
});
