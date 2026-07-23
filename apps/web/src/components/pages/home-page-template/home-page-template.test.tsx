import { customRender, screen } from '@web/testing/custom-render';

import { HomePageTemplate } from './home-page-template';

const setup = customRender(HomePageTemplate, {
  hero: <div>Hero content</div>,
  modules: <div>Modules content</div>,
});

describe('HomePageTemplate', () => {
  beforeEach(() => {
    setup();
  });

  it('renders the hero and modules slots', () => {
    expect(screen.getByText('Hero content')).toBeVisible();
    expect(screen.getByText('Modules content')).toBeVisible();
  });

  it('renders a single main landmark wrapping both slots', () => {
    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByText('Hero content'));
    expect(main).toContainElement(screen.getByText('Modules content'));
  });
});
