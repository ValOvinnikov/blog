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

  it('renders hero and modules as direct, unwrapped children of main', () => {
    const main = screen.getByRole('main');
    const hero = screen.getByText('Hero content');
    const modules = screen.getByText('Modules content');

    expect(hero.parentElement).toBe(main);
    expect(modules.parentElement).toBe(main);
  });

  it('renders no breadcrumb navigation — home has no BreadcrumbBar', () => {
    expect(
      screen.queryByRole('navigation', { name: 'Breadcrumb' }),
    ).not.toBeInTheDocument();
  });
});
