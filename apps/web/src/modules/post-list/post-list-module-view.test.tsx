import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';

import { PostListModuleView } from './post-list-module-view';

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

const post = makePostListItem();

const setup = customRender(PostListModuleView, {
  id: 'post-list-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  sectionHeader: {
    heading: 'Latest posts',
    supportingText: undefined,
    align: undefined,
  },
  items: [post],
  layout: undefined,
});

describe(PostListModuleView, () => {
  it('labels the section with a unique id derived from the module id', () => {
    setup();

    const label = screen.getByText('Latest posts');
    expect(label).toHaveAttribute('id', 'latest-posts-post-list-1');

    const section = label.closest('section');
    expect(section).toHaveAttribute(
      'aria-labelledby',
      'latest-posts-post-list-1',
    );
  });

  it('derives a different section id for a different module id, avoiding duplicate DOM ids', () => {
    setup({
      id: 'post-list-2',
      sectionHeader: {
        heading: 'More posts',
        supportingText: undefined,
        align: undefined,
      },
    });

    expect(screen.getByText('More posts')).toHaveAttribute(
      'id',
      'latest-posts-post-list-2',
    );
  });

  it('falls back to "Latest posts" when sectionHeader.heading is undefined', () => {
    setup({
      sectionHeader: {
        heading: undefined,
        supportingText: undefined,
        align: undefined,
      },
    });

    const label = screen.getByText('Latest posts');
    expect(label).toHaveAttribute('id', 'latest-posts-post-list-1');
  });
});
