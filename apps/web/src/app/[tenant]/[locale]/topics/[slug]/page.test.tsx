import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import TopicDetailPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_SLUG = faker.lorem.slug();
const MOCK_METADATA = { title: faker.lorem.words(2) };

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

describe(`<${TopicDetailPage.name}/>`, () => {
  beforeEach(async () => {
    await setup();
  });

  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', () => {
    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  it('renders TopicPage with the resolved slug', () => {
    const topicPage = screen.getByTestId('topic-page');

    expect(topicPage).toHaveTextContent(MOCK_SLUG);
  });
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildTopicMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('returns the topic metadata built for the resolved slug', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildTopicMetadata).toHaveBeenCalledWith(MOCK_SLUG);
  });

  it('enters the request context before building the metadata', async () => {
    await generateMetadata({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });
});
