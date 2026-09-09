import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';

import { PostFeaturedModuleView } from './post-featured-module-view';

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

const leadPost = makePostListItem({
  id: 'post-1',
  title: 'Lead post',
  excerpt: 'Lead excerpt',
  image: <div data-testid="lead-image" />,
});
const secondPost = makePostListItem({
  id: 'post-2',
  title: 'Second post',
  excerpt: 'Second excerpt',
  image: <div data-testid="second-image" />,
});
const thirdPost = makePostListItem({
  id: 'post-3',
  title: 'Third post',
  excerpt: 'Third excerpt',
});

const setup = customRender(PostFeaturedModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: {
    heading: 'Featured',
    supportingText: undefined,
  },
  items: [leadPost],
  layout: undefined,
  contentAlignment: undefined,
  titleId: 'featured-posts-title',
  dataTestId: 'post-featured-module-featured-1',
  accessibleTitle: 'Featured posts',
});

describe(`<${PostFeaturedModuleView.name}/>`, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('Featured');
    expect(label).toHaveAttribute('id', 'featured-posts-title');
    expect(label.tagName).toBe('H2');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'featured-posts-title');
    expect(section).toHaveAttribute(
      'data-testid',
      'post-featured-module-featured-1',
    );
    expect(
      screen.getByRole('region', { name: 'Featured' }),
    ).toBeInTheDocument();
  });

  it('renders a visually hidden heading from accessibleTitle when headingBlock.heading is undefined', () => {
    setup({
      headingBlock: {
        heading: undefined,
        supportingText: undefined,
      },
    });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Featured posts',
    });
    expect(heading).toHaveClass('sr-only');
    expect(
      screen.getByRole('region', { name: 'Featured posts' }),
    ).toBeInTheDocument();
  });

  it('renders the first item as a lead card with a level-3 heading link', () => {
    setup();

    const link = screen.getByRole('link', { name: 'Lead post' });
    expect(link).toHaveAttribute('href', leadPost.href);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Lead post' }),
    ).toBeInTheDocument();
  });

  it('marks the lead card isLead: its excerpt clamps to three lines, not two', () => {
    setup();

    const leadCard = screen.getByTestId('post-featured-module-featured-1-lead');
    expect(within(leadCard).getByText('Lead excerpt')).toHaveClass(
      'line-clamp-3',
    );
  });

  it('marks the lead card isSplit: it lays out md:flex-row when a media region is present', () => {
    setup({ hasImages: true });

    expect(
      screen.getByTestId('post-featured-module-featured-1-lead'),
    ).toHaveClass('md:flex-row');
  });

  it('renders nothing (no lead group, no cards) when items is empty', () => {
    const { container } = setup({ items: [] });

    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(
      container.querySelector('[data-testid$="-lead"]'),
    ).not.toBeInTheDocument();
  });

  it('renders only the lead card when exactly one item resolves', () => {
    setup({ items: [leadPost] });

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(
      screen.getByTestId('post-featured-module-featured-1-lead'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('post-featured-module-featured-1-tail'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('post-featured-module-featured-1-tail-grid'),
    ).not.toBeInTheDocument();
  });

  it('renders exactly one full-width split tail card when two items resolve', () => {
    setup({ items: [leadPost, secondPost], hasImages: true });

    expect(screen.getByText('Lead post')).toBeInTheDocument();
    expect(screen.getByText('Second post')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(
      screen.queryByTestId('post-featured-module-featured-1-tail-grid'),
    ).not.toBeInTheDocument();

    const tailCard = screen.getByTestId('post-featured-module-featured-1-tail');
    expect(tailCard).toHaveClass('md:flex-row');
    expect(within(tailCard).getByText('Second excerpt')).toHaveClass(
      'line-clamp-2',
    );
  });

  it('renders a two-column grid of the remaining posts when three or more items resolve', () => {
    setup({ items: [leadPost, secondPost, thirdPost] });

    const tailGrid = screen.getByTestId(
      'post-featured-module-featured-1-tail-grid',
    );

    expect(within(tailGrid).getByText('Second post')).toBeInTheDocument();
    expect(within(tailGrid).getByText('Third post')).toBeInTheDocument();
    expect(within(tailGrid).queryByText('Lead post')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);

    expect(within(tailGrid).getByText('Second excerpt')).not.toHaveClass(
      'md:flex-row',
    );
    expect(within(tailGrid).getByText('Third excerpt')).not.toHaveClass(
      'line-clamp-3',
    );
  });

  it('renders no media region when hasImages is not given', () => {
    setup();

    expect(screen.queryByTestId('post-card-media')).not.toBeInTheDocument();
  });

  it('renders a media region for the lead card when hasImages is true', () => {
    setup({ hasImages: true });

    expect(screen.getByTestId('post-card-media')).toBeInTheDocument();
    expect(screen.getByTestId('lead-image')).toBeInTheDocument();
  });
});
