import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BlogPageTemplate } from './blog-page-template';

describe(`<${BlogPageTemplate.name}/>`, () => {
  it('renders the heading as the page h1 with posts and pagination slots', () => {
    render(
      <BlogPageTemplate
        heading="Blog"
        posts={<div data-testid="posts-slot" />}
        pagination={<div data-testid="pagination-slot" />}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
    expect(screen.getByRole('main')).toBeVisible();
    expect(screen.getByTestId('posts-slot')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-slot')).toBeInTheDocument();
  });

  it('renders without a pagination slot', () => {
    render(
      <BlogPageTemplate
        heading="Blog"
        posts={<div data-testid="posts-slot" />}
      />,
    );

    expect(screen.getByTestId('posts-slot')).toBeInTheDocument();
  });

  it('renders supportingText under the h1 when passed', () => {
    render(
      <BlogPageTemplate
        heading="Blog"
        supportingText="Essays and notes on building this site."
        posts={<div data-testid="posts-slot" />}
      />,
    );

    expect(
      screen.getByText('Essays and notes on building this site.'),
    ).toBeVisible();
  });

  it('omits supportingText when not passed', () => {
    render(
      <BlogPageTemplate
        heading="Blog"
        posts={<div data-testid="posts-slot" />}
      />,
    );

    expect(
      screen.queryByText('Essays and notes on building this site.'),
    ).not.toBeInTheDocument();
  });
});
