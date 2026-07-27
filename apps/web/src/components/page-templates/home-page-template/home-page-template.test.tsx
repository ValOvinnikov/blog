import { customRender, screen } from '@web/testing/custom-render';

import { HomePageTemplate } from './home-page-template';

const setup = customRender(HomePageTemplate, {
  hero: <div>Hero content</div>,
  modules: <div>Modules content</div>,
});

describe(`<${HomePageTemplate.name}/>`, () => {
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

  it('renders hero as a direct child of main, unwrapped by the modules container', () => {
    const main = screen.getByRole('main');
    const hero = screen.getByText('Hero content');

    expect(hero.parentElement).toBe(main);
  });
});
