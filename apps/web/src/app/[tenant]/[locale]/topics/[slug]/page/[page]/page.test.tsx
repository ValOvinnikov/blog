import { faker } from '@faker-js/faker';
import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@shinefold/config';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import TopicNumberedPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_TOPIC_SLUG = faker.lorem.slug();
const MOCK_METADATA = { title: faker.lorem.words(2) };
const MOCK_PAGE = faker.number.int({ min: 2, max: 999 });

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

const pageParams = paramsFor(String(MOCK_PAGE));

const setup = customRenderAsync(TopicNumberedPage, { params: pageParams });

describe(`<${TopicNumberedPage.name}/>`, () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('renders TopicPage for the requested slug and page', async () => {
    await setup();

    const topicPage = screen.getByTestId('topic-page');

    expect(topicPage).toHaveTextContent(`${MOCK_TOPIC_SLUG}:${MOCK_PAGE}`);
  });

  it('redirects page 1 to the topic first page', async () => {
    await expect(setup({ params: paramsFor(String(1)) })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(permanentRedirect).toHaveBeenCalledWith({
      href: routes.topic(MOCK_TOPIC_SLUG, 1),
      locale: LOCALE_ISO_CODES.EN,
    });
  });
});

describe(generateMetadata, () => {
  it('builds the topic metadata for the requested page', async () => {
    vi.mocked(buildTopicMetadata).mockResolvedValue(MOCK_METADATA);

    const metadata = await generateMetadata({ params: pageParams });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildTopicMetadata).toHaveBeenCalledWith(MOCK_TOPIC_SLUG, MOCK_PAGE);
  });
});
