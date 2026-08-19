import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync } from '@web/testing/custom-render';

import { PostListModule } from './post-list-module';

const { getPostListMock } = vi.hoisted(() => ({
  getPostListMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postList: { v1: { getPostList: getPostListMock } },
    },
  },
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

const setup = customRenderAsync(PostListModule, {
  id: 'post-list-1',
  locale: 'en',
});

describe(PostListModule, () => {
  beforeEach(() => {
    getPostListMock.mockReset();
  });

  it('renders nothing when the fetch fails', async () => {
    getPostListMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no posts resolve, never an empty landmark with a dangling aria-labelledby', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Latest posts',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
      },
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(container.querySelector('section')).not.toBeInTheDocument();
  });
});
