import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import TopicNumberedPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_TOPIC_SLUG = faker.lorem.slug();
const MOCK_METADATA = { title: faker.lorem.words(2) };
const FIRST_PAGE = '1';
const SECOND_PAGE = '2';
const NON_CANONICAL_PAGES = ['abc', '02'];

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

vi.mock('@web/metadata/topic-metadata', () => ({
  buildTopicMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/topic-page', () => ({
  TopicPage: ({ slug, page }: { slug: string; page: number }) => (
    <div data-testid="topic-page">{`${slug}:${page}`}</div>
  ),
}));

const paramsFor = (page: string) =>
  mockRouteParams({ slug: MOCK_TOPIC_SLUG, page });

const firstPageParams = paramsFor(FIRST_PAGE);

const setup = customRenderAsync(TopicNumberedPage, {
  params: firstPageParams,
});

describe(`<${TopicNumberedPage.name}/>`, () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('renders TopicPage for the requested slug and page', async () => {
    await setup({ params: paramsFor(SECOND_PAGE) });

    const topicPage = screen.getByTestId('topic-page');

    expect(topicPage).toHaveTextContent(`${MOCK_TOPIC_SLUG}:${SECOND_PAGE}`);
  });

  it('redirects page 1 to the canonical topic URL', async () => {
    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(enterRequestContext).toHaveBeenCalledWith(firstPageParams);
    expect(permanentRedirect).toHaveBeenCalledWith({
      href: routes.topic(MOCK_TOPIC_SLUG, 1),
      locale: LOCALE_ISO_CODES.EN,
    });
  });

  it.each(NON_CANONICAL_PAGES)(
    'hard-404s a non-canonical page param (%s)',
    async (page) => {
      await expect(setup({ params: paramsFor(page) })).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(notFound).toHaveBeenCalledTimes(1);
    },
  );
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildTopicMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('builds the topic metadata for page 2', async () => {
    const metadata = await generateMetadata({ params: paramsFor(SECOND_PAGE) });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildTopicMetadata).toHaveBeenCalledWith(
      MOCK_TOPIC_SLUG,
      Number(SECOND_PAGE),
    );
  });

  it.each([FIRST_PAGE, ...NON_CANONICAL_PAGES])(
    'returns empty metadata without building any for page param %s',
    async (page) => {
      const metadata = await generateMetadata({ params: paramsFor(page) });

      expect(metadata).toEqual({});
      expect(buildTopicMetadata).not.toHaveBeenCalled();
    },
  );
});
