import { buildTopicIndexMetadata } from '@web/metadata/topic-index-metadata';
import { testPageRouteContract } from '@web/testing/app/page-route-contract';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import TopicIndexRoute, { generateMetadata, revalidate } from './page';

const params = mockRouteParams();

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/topic-index-metadata', () => ({
  buildTopicIndexMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/topic-index-page', () => ({
  TopicIndexPage: () => <div data-testid="topic-index-page" />,
}));

const setup = customRenderAsync(TopicIndexRoute, { params });

testPageRouteContract({
  page: TopicIndexRoute,
  generateMetadata,
  revalidate,
  params,
  buildMetadata: buildTopicIndexMetadata,
  buildMetadataArgs: [],
});

describe(`<${TopicIndexRoute.name}/>`, () => {
  it('renders TopicIndexPage', async () => {
    await setup();

    const topicIndexPage = screen.getByTestId('topic-index-page');

    expect(topicIndexPage).toBeVisible();
  });
});
