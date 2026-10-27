import { SITE_MESSAGES } from '@blog/config';
import { service } from '@blog/service';
import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import {
  MOCK_SECOND_TOPIC,
  mockTopicWithPostCount,
} from '@web/testing/shared/topic/fixtures';

import { TopicChips } from './topic-chips';

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

const MOCK_ACTIVE_SLUG = faker.lorem.slug();
const MOCK_ACTIVE_TOPIC = mockTopicWithPostCount({
  id: faker.string.uuid(),
  title: faker.lorem.words(2),
  slug: MOCK_ACTIVE_SLUG,
});

const getTopicsMock = vi.mocked(service.entities.topics.v1.getTopics);

const { ariaLabel: NAV_NAME, all: ALL_LABEL } = SITE_MESSAGES.topicChipList;

const setup = customRenderAsync(TopicChips, {
  activeSlug: MOCK_ACTIVE_SLUG,
});

describe(`<${TopicChips.name}/>`, () => {
  describe('with topics', () => {
    beforeEach(async () => {
      getTopicsMock.mockResolvedValue(
        okResult([MOCK_ACTIVE_TOPIC, MOCK_SECOND_TOPIC]),
      );
      await setup();
    });

    it('highlights the current topic chip only', () => {
      const nav = screen.getByRole('navigation', { name: NAV_NAME });
      const currentLink = within(nav).getByRole('link', {
        name: MOCK_ACTIVE_TOPIC.title,
      });
      const otherLink = within(nav).getByRole('link', {
        name: MOCK_SECOND_TOPIC.title,
      });
      const allLink = within(nav).getByRole('link', { name: ALL_LABEL });

      expect(currentLink).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(otherLink).not.toHaveAttribute(ARIA_CURRENT);
      expect(allLink).not.toHaveAttribute(ARIA_CURRENT);
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
