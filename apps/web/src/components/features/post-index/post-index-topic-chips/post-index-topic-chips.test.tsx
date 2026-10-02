import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';

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
      makeTopicWithPostCount({ title: 'Engineering', slug: 'engineering' }),
    ]);

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Topics' });
    expect(within(nav).getByRole('link', { name: 'All' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(
      within(nav).getByRole('link', { name: 'Engineering' }),
    ).toHaveAttribute('href', '/topics/engineering');
  });

  it('renders nothing when there are no topics', async () => {
    getTopicsSafelyMock.mockResolvedValue([]);

    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'Topics' }),
    ).not.toBeInTheDocument();
  });

  it('forwards the request context Sanity context to getTopicsSafely', async () => {
    getTopicsSafelyMock.mockResolvedValue([]);

    await setup();

    expect(getTopicsSafelyMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });
});
