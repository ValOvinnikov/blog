import { customRender, screen } from '@web/testing/custom-render';

import { CategoryChipList } from './category-chip-list';

vi.mock('@web/i18n/navigation', () => ({
  Link: ({
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

const categories = [
  {
    id: 'cat-1',
    title: 'Engineering',
    slug: 'engineering',
    description: undefined,
    postCount: 3,
  },
  {
    id: 'cat-2',
    title: 'Design',
    slug: 'design',
    description: undefined,
    postCount: 1,
  },
];

const setup = customRender(CategoryChipList, { categories });

describe(`<${CategoryChipList.name}/>`, () => {
  it('renders a Categories nav landmark', () => {
    setup();

    expect(
      screen.getByRole('navigation', { name: 'Categories' }),
    ).toBeVisible();
  });

  it('renders nothing when there are no categories', () => {
    setup({ categories: [] });

    expect(
      screen.queryByRole('navigation', { name: 'Categories' }),
    ).not.toBeInTheDocument();
  });

  it('renders an "All" chip linking to the blog index', () => {
    setup();

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('renders one chip per category linking to its archive', () => {
    setup();

    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'href',
      '/category/engineering',
    );
    expect(screen.getByRole('link', { name: 'Design' })).toHaveAttribute(
      'href',
      '/category/design',
    );
  });

  it('marks "All" as the current page when no activeSlug is given', () => {
    setup();

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Engineering' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the matching category chip as the current page when activeSlug is given', () => {
    setup({ activeSlug: 'engineering' });

    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'Design' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
