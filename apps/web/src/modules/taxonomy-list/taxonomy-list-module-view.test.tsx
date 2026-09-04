import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

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
};

const setup = customRender(TaxonomyListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  sectionHeader: {
    heading: 'Browse by topic',
    supportingText: undefined,
  },
  items: [item],
  layout: undefined,
  contentAlignment: undefined,
  titleId: 'topic-list-title',
  dataTestId: 'taxonomy-list-module-topic-list-1',
  headingLevel: 2,
  accessibleTitle: 'Topics',
  emptyMessage: 'No topics yet.',
});

describe(TaxonomyListModuleView, () => {
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

  it('renders a visually hidden heading from accessibleTitle when sectionHeader.heading is undefined', () => {
    setup({
      sectionHeader: {
        heading: undefined,
        supportingText: undefined,
      },
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
});
