import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePageTemplate } from './home-page-template';

describe('HomePageTemplate', () => {
  it('renders the hero and modules slots', () => {
    render(
      <HomePageTemplate
        hero={<div>Hero content</div>}
        modules={<div>Modules content</div>}
      />,
    );

    expect(screen.getByText('Hero content')).toBeVisible();
    expect(screen.getByText('Modules content')).toBeVisible();
  });

  it('renders a single main landmark wrapping both slots', () => {
    render(
      <HomePageTemplate
        hero={<div>Hero content</div>}
        modules={<div>Modules content</div>}
      />,
    );

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByText('Hero content'));
    expect(main).toContainElement(screen.getByText('Modules content'));
  });
});
