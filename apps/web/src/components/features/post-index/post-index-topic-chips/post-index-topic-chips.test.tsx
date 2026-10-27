import { routes, SITE_MESSAGES } from '@blog/config';
import { service } from '@blog/service';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockTopicWithPostCount } from '@web/testing/shared/topic/fixtures';

import { PostIndexTopicChips } from './post-index-topic-chips';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    service: { entities: { topics: { v1: { getTopics: vi.fn() } } } },
  };
});

faker.seed(5776);

const MOCK_TOPIC_SLUG = faker.lorem.slug();
const MOCK_TOPIC = mockTopicWithPostCount({
  id: faker.string.uuid(),
  title: faker.lorem.words(2),
  slug: MOCK_TOPIC_SLUG,
});

const getTopicsMock = vi.mocked(service.entities.topics.v1.getTopics);

const { ariaLabel: NAV_NAME, all: ALL_LABEL } = SITE_MESSAGES.topicChipList;

const setup = customRenderAsync(PostIndexTopicChips, {});

describe(`<${PostIndexTopicChips.name}/>`, () => {
  describe('with topics', () => {
    beforeEach(async () => {
      getTopicsMock.mockResolvedValue(okResult([MOCK_TOPIC]));
      await setup();
    });

    it('links the blog index and each fetched topic', () => {
      const nav = screen.getByRole('navigation', { name: NAV_NAME });
      const allLink = within(nav).getByRole('link', { name: ALL_LABEL });
      const topicLink = within(nav).getByRole('link', {
        name: MOCK_TOPIC.title,
      });

      expect(allLink).toHaveAttribute('href', routes.blogIndex());
      expect(topicLink).toHaveAttribute('href', routes.topic(MOCK_TOPIC_SLUG));
    });

    it('fetches the topics with the request tenant context', () => {
      expect(getTopicsMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
    });
  });

  it('renders nothing when there are no topics', async () => {
    getTopicsMock.mockResolvedValueOnce(okResult([]));

    await setup();

    const nav = screen.queryByRole('navigation', { name: NAV_NAME });

    expect(nav).not.toBeInTheDocument();
  });
});
