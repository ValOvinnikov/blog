import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockTopicWithPostCount } from '@web/testing/shared/topic/fixtures';

import { PostIndexTopicChips } from './post-index-topic-chips';

vi.mock('@web/server/request-context/request-context');

const { getTopicsSafelyMock } = vi.hoisted(() => ({
  getTopicsSafelyMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/utils/get-topics-safely', () => ({
  getTopicsSafely: getTopicsSafelyMock,
}));

const setup = customRenderAsync(PostIndexTopicChips, { tenant: 'tenant-1' });

describe(`<${PostIndexTopicChips.name}/>`, () => {
  beforeEach(() => {
    getTopicsSafelyMock.mockReset();
  });

  it('renders the topic chip row from the fetched topics', async () => {
    getTopicsSafelyMock.mockResolvedValue([
      mockTopicWithPostCount({ title: 'Engineering', slug: 'engineering' }),
    ]);

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Topics' });
    const allLink = within(nav).getByRole('link', { name: 'All' });
    const engineeringLink = within(nav).getByRole('link', {
      name: 'Engineering',
    });

    expect(allLink).toHaveAttribute('href', '/blog');
    expect(engineeringLink).toHaveAttribute('href', '/topics/engineering');
  });

  describe('with no topics', () => {
    beforeEach(async () => {
      getTopicsSafelyMock.mockResolvedValue([]);
      await setup();
    });

    it('renders nothing when there are no topics', async () => {
      const topicsNav = screen.queryByRole('navigation', { name: 'Topics' });

      expect(topicsNav).not.toBeInTheDocument();
    });

    it('forwards the request context Sanity context to getTopicsSafely', async () => {
      expect(getTopicsSafelyMock).toHaveBeenCalledWith(
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });
  });
});
