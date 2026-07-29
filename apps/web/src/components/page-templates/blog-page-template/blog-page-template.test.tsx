import { customRender, screen } from '@web/testing/custom-render';

import { BlogPageTemplate } from './blog-page-template';

const setup = customRender(BlogPageTemplate, {
  heading: 'Blog',
  posts: <div data-testid="posts-slot" />,
});

describe(`<${BlogPageTemplate.name}/>`, () => {
  it('renders the heading as the page h1 with posts and pagination slots', () => {
    setup({ pagination: <div data-testid="pagination-slot" /> });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
    expect(screen.getByRole('main')).toBeVisible();
    expect(screen.getByTestId('posts-slot')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-slot')).toBeInTheDocument();
  });

  it('renders without a pagination slot', () => {
    setup();

    expect(screen.getByTestId('posts-slot')).toBeInTheDocument();
  });

  it('renders supportingText under the h1 when passed', () => {
    setup({
      supportingText: 'Essays and notes on building this site.',
    });

    expect(
      screen.getByText('Essays and notes on building this site.'),
    ).toBeVisible();
  });

  it('omits supportingText when not passed', () => {
    setup();

    expect(
      screen.queryByText('Essays and notes on building this site.'),
    ).not.toBeInTheDocument();
  });

  it('renders introHeader before the h1 when passed', () => {
    setup({ introHeader: <div data-testid="intro-header-slot" /> });

    expect(screen.getByTestId('intro-header-slot')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
  });

  it('omits introHeader when not passed', () => {
    setup();

    expect(screen.queryByTestId('intro-header-slot')).not.toBeInTheDocument();
  });

  it('renders categoryChips after supportingText and before posts when passed', () => {
    setup({ categoryChips: <div data-testid="category-chips-slot" /> });

    expect(screen.getByTestId('category-chips-slot')).toBeInTheDocument();
    expect(screen.getByTestId('posts-slot')).toBeInTheDocument();
  });

  it('omits categoryChips when not passed', () => {
    setup();

    expect(screen.queryByTestId('category-chips-slot')).not.toBeInTheDocument();
  });

  it('renders socialLinks after supportingText and before posts when passed', () => {
    setup({ socialLinks: <div data-testid="social-links-slot" /> });

    expect(screen.getByTestId('social-links-slot')).toBeInTheDocument();
    expect(screen.getByTestId('posts-slot')).toBeInTheDocument();
  });

  it('omits socialLinks when not passed', () => {
    setup();

    expect(screen.queryByTestId('social-links-slot')).not.toBeInTheDocument();
  });
});
