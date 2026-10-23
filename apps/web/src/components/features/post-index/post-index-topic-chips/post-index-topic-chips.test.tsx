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

const setup = customRenderAsync(PostIndexTopicChips, {});

describe(`<${PostIndexTopicChips.name}/>`, () => {
  beforeEach(() => {
    getTopicsSafelyMock.mockReset();
  });

  it('renders the fetched topics as chips', async () => {
    getTopicsSafelyMock.mockResolvedValue([
      mockTopicWithPostCount({ title: 'Engineering', slug: 'engineering' }),
    ]);

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Topics' });
    const topicChip = within(nav).getByRole('link', { name: 'Engineering' });
    expect(topicChip).toHaveAttribute('href', '/topics/engineering');
  });

  it('forwards the request context Sanity context to getTopicsSafely', async () => {
    getTopicsSafelyMock.mockResolvedValue([]);

    await setup();

    expect(getTopicsSafelyMock).toHaveBeenCalledWith(
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });
});
