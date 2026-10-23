import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockTopicWithPostCount } from '@web/testing/shared/topic/fixtures';

import { TopicChips } from './topic-chips';

vi.mock('@web/server/request-context/request-context');

const { getTopicsSafelyMock } = vi.hoisted(() => ({
  getTopicsSafelyMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/utils/get-topics-safely', () => ({
  getTopicsSafely: getTopicsSafelyMock,
}));

const ACTIVE_SLUG = 'news';

const setup = customRenderAsync(TopicChips, {
  activeSlug: ACTIVE_SLUG,
});

describe(`<${TopicChips.name}/>`, () => {
  beforeEach(() => {
    getTopicsSafelyMock.mockReset();
  });

  it('marks the active topic chip as the current page', async () => {
    getTopicsSafelyMock.mockResolvedValue([
      mockTopicWithPostCount({ title: 'News', slug: ACTIVE_SLUG }),
    ]);

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Topics' });
    const activeChip = within(nav).getByRole('link', { name: 'News' });
    expect(activeChip).toHaveAttribute('aria-current', 'page');
  });

  it('forwards the request context Sanity context to getTopicsSafely', async () => {
    getTopicsSafelyMock.mockResolvedValue([]);

    await setup();

    expect(getTopicsSafelyMock).toHaveBeenCalledWith(
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });
});
