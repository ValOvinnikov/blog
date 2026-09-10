import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';

import { BlogListTopicChips } from './blog-list-topic-chips';

const { getTopicsSafelyMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getTopicsSafelyMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@web/utils/get-topics-safely', () => ({
  getTopicsSafely: getTopicsSafelyMock,
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const setup = customRenderAsync(BlogListTopicChips, { tenant: 'tenant-1' });

describe(`<${BlogListTopicChips.name}/>`, () => {
  beforeEach(() => {
    getTopicsSafelyMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
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

  it('resolves the tenant Sanity context, then forwards it to getTopicsSafely', async () => {
    getTopicsSafelyMock.mockResolvedValue([]);

    await setup();

    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
    expect(getTopicsSafelyMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });
});
