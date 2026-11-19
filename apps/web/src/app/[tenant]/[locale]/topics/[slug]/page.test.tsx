import { faker } from '@faker-js/faker';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import TopicDetailPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_SLUG = faker.lorem.slug();

const params = mockRouteParams({ slug: MOCK_SLUG });

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/components/pages/topic-page', () => ({
  TopicPage: ({ slug }: { slug: string }) => (
    <div data-testid="topic-page">{slug}</div>
  ),
}));

vi.mock('@web/metadata/topic-metadata', () => ({
  buildTopicMetadata: vi.fn(),
}));

const setup = customRenderAsync(TopicDetailPage, { params });

testPageRouteContract({
  page: TopicDetailPage,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildTopicMetadata,
  buildMetadataArgs: [MOCK_SLUG],
});

describe(`<${TopicDetailPage.name}/>`, () => {
  it('renders TopicPage with the resolved slug', async () => {
    await setup();

    const topicPage = screen.getByTestId('topic-page');

    expect(topicPage).toHaveTextContent(MOCK_SLUG);
  });
});
