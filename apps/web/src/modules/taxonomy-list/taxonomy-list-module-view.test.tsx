import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TaxonomyListModuleView } from './taxonomy-list-module-view';

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

const item = {
  id: 'topic-1',
  title: 'Engineering',
  description: 'Posts about building things.',
  postCountLabel: '5 posts',
  href: '/topics/engineering',
  posts: [
    {
      id: 'post-1',
      title: 'Shipping the new build pipeline',
      href: '/blog/shipping-the-new-build-pipeline',
    },
    {
      id: 'post-2',
      title: 'Why we rewrote our test runner',
      href: '/blog/why-we-rewrote-our-test-runner',
    },
  ],
  latestPostsLabel: 'Latest in Engineering',
};

const setup = customRender(TaxonomyListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Browse by topic' }),
  items: [item],
  layout: undefined,
  contentAlignment: undefined,
  titleId: 'topic-list-title',
  dataTestId: 'taxonomy-list-module-topic-list-1',
  headingLevel: 2,
  accessibleTitle: 'Topics',
  emptyMessage: 'No topics yet.',
  showLatestPosts: true,
});

describe(`<${TaxonomyListModuleView.name}/>`, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('Browse by topic');
    expect(label).toHaveAttribute('id', 'topic-list-title');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'topic-list-title');
    expect(section).toHaveAttribute(
      'data-testid',
      'taxonomy-list-module-topic-list-1',
    );
    expect(
      screen.getByRole('region', { name: 'Browse by topic' }),
    ).toBeInTheDocument();
  });

  it('renders the section heading as an h2 by default', () => {
    setup();

    const label = screen.getByText('Browse by topic');
    expect(label.tagName).toBe('H2');
  });

  it('renders the section heading at the given headingLevel', () => {
    setup({ headingLevel: 3 });

    const label = screen.getByText('Browse by topic');
    expect(label.tagName).toBe('H3');
  });

  it('renders a visually hidden heading from accessibleTitle when headingBlock.heading is empty', () => {
    setup({
      headingBlock: makeHeadingBlock({ heading: '' }),
    });

    const heading = screen.getByRole('heading', { level: 2, name: 'Topics' });
    expect(heading).toHaveClass('sr-only');
    expect(screen.getByRole('region', { name: 'Topics' })).toBeInTheDocument();
  });

  it('renders a card per entry, linking to its href with the post count as level-3 heading', () => {
    setup();

    const link = screen.getByRole('link', { name: /Engineering/ });
    expect(link).toHaveAttribute('href', '/topics/engineering');
    expect(
      screen.getByRole('heading', { level: 3, name: /Engineering/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Posts about building things.')).toBeVisible();
    expect(screen.getByText('5 posts')).toBeVisible();
  });

  it('renders the empty message instead of the grid when items is empty', () => {
    setup({ items: [] });

    expect(screen.getByText('No topics yet.')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('lists an entry’s latest posts, newest first, when showLatestPosts is on', () => {
    setup();

    const list = screen.getByRole('list', { name: 'Latest in Engineering' });
    const postLinks = within(list).getAllByRole('link');
    expect(postLinks.map((link) => link.textContent)).toEqual([
      'Shipping the new build pipeline',
      'Why we rewrote our test runner',
    ]);
    expect(postLinks[0]).toHaveAttribute(
      'href',
      '/blog/shipping-the-new-build-pipeline',
    );
  });

  it('omits the latest-posts list when showLatestPosts is off, even though posts exist', () => {
    setup({ showLatestPosts: false });

    expect(
      screen.queryByRole('list', { name: 'Latest in Engineering' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Shipping the new build pipeline'),
    ).not.toBeInTheDocument();
  });

  it('omits the latest-posts list when the entry has no posts, even though the flag is on', () => {
    setup({ items: [{ ...item, posts: [] }] });

    expect(
      screen.queryByRole('list', { name: 'Latest in Engineering' }),
    ).not.toBeInTheDocument();
  });
});
