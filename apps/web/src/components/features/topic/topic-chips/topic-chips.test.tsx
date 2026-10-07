import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';

import { TopicChips } from './topic-chips';

vi.mock('@web/server/request-context/request-context');

const { getTopicsSafelyMock } = vi.hoisted(() => ({
  getTopicsSafelyMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/utils/get-topics-safely', () => ({
  getTopicsSafely: getTopicsSafelyMock,
}));

const setup = customRenderAsync(TopicChips, {
  activeSlug: 'news',
});

describe(`<${TopicChips.name}/>`, () => {
  beforeEach(() => {
    getTopicsSafelyMock.mockReset();
  });

  it('renders the topic chip row with the current topic highlighted', async () => {
    getTopicsSafelyMock.mockResolvedValue([
      makeTopicWithPostCount({ title: 'News', slug: 'news' }),
      makeTopicWithPostCount({
        id: 'topic-2',
        title: 'Design',
        slug: 'design',
      }),
    ]);

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Topics' });
    expect(within(nav).getByRole('link', { name: 'News' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      within(nav).getByRole('link', { name: 'Design' }),
    ).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'All' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  describe('with no topics', () => {
    beforeEach(async () => {
      getTopicsSafelyMock.mockResolvedValue([]);
      await setup();
    });

    it('renders nothing when there are no topics', async () => {
      expect(
        screen.queryByRole('navigation', { name: 'Topics' }),
      ).not.toBeInTheDocument();
    });

    it('forwards the request context Sanity context to getTopicsSafely', async () => {
      expect(getTopicsSafelyMock).toHaveBeenCalledWith(
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });
  });
});
