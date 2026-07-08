import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePageTemplate } from './home-page-template';

describe('HomePageTemplate', () => {
  it('renders the hero and latest posts slots', () => {
    render(
      <HomePageTemplate
        hero={<div>Hero content</div>}
        latestPosts={<div>Latest posts content</div>}
      />,
    );

    expect(screen.getByText('Hero content')).toBeVisible();
    expect(screen.getByText('Latest posts content')).toBeVisible();
  });

  it('renders a single main landmark wrapping both slots', () => {
    render(
      <HomePageTemplate
        hero={<div>Hero content</div>}
        latestPosts={<div>Latest posts content</div>}
      />,
    );

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByText('Hero content'));
    expect(main).toContainElement(screen.getByText('Latest posts content'));
  });
});
