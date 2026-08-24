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

  it('renders without a posts slot', () => {
    setup({ posts: undefined });

    expect(screen.queryByTestId('posts-slot')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toBeVisible();
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

  it('renders topicChips after supportingText and before posts when passed', () => {
    setup({ topicChips: <div data-testid="topic-chips-slot" /> });

    expect(screen.getByTestId('topic-chips-slot')).toBeInTheDocument();
    expect(screen.getByTestId('posts-slot')).toBeInTheDocument();
  });

  it('omits topicChips when not passed', () => {
    setup();

    expect(screen.queryByTestId('topic-chips-slot')).not.toBeInTheDocument();
  });

  it('renders modules after posts/pagination when passed', () => {
    setup({ modules: <div data-testid="modules-slot" /> });

    expect(screen.getByTestId('modules-slot')).toBeInTheDocument();
  });

  it('omits modules when not passed', () => {
    setup();

    expect(screen.queryByTestId('modules-slot')).not.toBeInTheDocument();
  });

  it('renders modules as a direct child of main, outside the constrained furniture container that wraps posts', () => {
    setup({ modules: <div data-testid="modules-slot" /> });

    const main = screen.getByRole('main');
    const modules = screen.getByTestId('modules-slot');
    const posts = screen.getByTestId('posts-slot');

    expect(modules.parentElement).toBe(main);
    expect(posts.parentElement).not.toBe(main);
  });
});
