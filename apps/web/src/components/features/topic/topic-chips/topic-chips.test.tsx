import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import {
  MOCK_DESIGN_TOPIC,
  mockTopicWithPostCount,
} from '@web/testing/shared/topic/fixtures';

import { TopicChips } from './topic-chips';

vi.mock('@web/server/request-context/request-context');

const { getTopicsSafelyMock } = vi.hoisted(() => ({
  getTopicsSafelyMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/utils/get-topics-safely', () => ({
  getTopicsSafely: getTopicsSafelyMock,
}));

const ARIA_CURRENT = 'aria-current';
const NAV_NAME = 'Topics';
const NEWS_SLUG = 'news';
const newsTopic = mockTopicWithPostCount({ title: 'News', slug: NEWS_SLUG });

const setup = customRenderAsync(TopicChips, {
  activeSlug: NEWS_SLUG,
});

describe(`<${TopicChips.name}/>`, () => {
  beforeEach(() => {
    getTopicsSafelyMock.mockReset();
  });

  it('renders the topic chip row with the current topic highlighted', async () => {
    getTopicsSafelyMock.mockResolvedValue([newsTopic, MOCK_DESIGN_TOPIC]);

    await setup();

    const nav = screen.getByRole('navigation', { name: NAV_NAME });
    const currentLink = within(nav).getByRole('link', {
      name: newsTopic.title,
    });
    const designLink = within(nav).getByRole('link', {
      name: MOCK_DESIGN_TOPIC.title,
    });
    const allLink = within(nav).getByRole('link', { name: 'All' });

    expect(currentLink).toHaveAttribute(ARIA_CURRENT, 'page');
    expect(designLink).not.toHaveAttribute(ARIA_CURRENT);
    expect(allLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  describe('with no topics', () => {
    beforeEach(async () => {
      getTopicsSafelyMock.mockResolvedValue([]);
      await setup();
    });

    it('renders nothing when there are no topics', () => {
      const nav = screen.queryByRole('navigation', { name: NAV_NAME });

      expect(nav).not.toBeInTheDocument();
    });

    it('forwards the request context Sanity context to getTopicsSafely', () => {
      expect(getTopicsSafelyMock).toHaveBeenCalledWith(
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });
  });
});
