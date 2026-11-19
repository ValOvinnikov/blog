import { faker } from '@faker-js/faker';
import { routes } from '@shinefold/config';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import {
  MOCK_SECOND_PAGE,
  testPaginatedRouteContract,
} from '@web/testing/app/paginated-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import TopicNumberedPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_TOPIC_SLUG = faker.lorem.slug();

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

const params = paramsFor(MOCK_SECOND_PAGE);

const setup = customRenderAsync(TopicNumberedPage, { params });

testPageRouteContract({
  page: TopicNumberedPage,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildTopicMetadata,
  buildMetadataArgs: [MOCK_TOPIC_SLUG, Number(MOCK_SECOND_PAGE)],
});

testPaginatedRouteContract({
  page: TopicNumberedPage,
  paramsFor,
  firstPageHref: routes.topic(MOCK_TOPIC_SLUG, 1),
});

describe(`<${TopicNumberedPage.name}/>`, () => {
  it('renders TopicPage for the requested slug and page', async () => {
    await setup();

    const topicPage = screen.getByTestId('topic-page');

    expect(topicPage).toHaveTextContent(
      `${MOCK_TOPIC_SLUG}:${MOCK_SECOND_PAGE}`,
    );
  });
});
