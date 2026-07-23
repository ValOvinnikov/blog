import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';

import { Hero } from './hero';

const setup = customRender(Hero, {
  title: 'Building a Design System',
  titleId: 'hero-title',
});

describe(`<${Hero.name}/>`, () => {
  it('renders the title', () => {
    setup();
    expect(
      screen.getByRole('heading', { name: 'Building a Design System' }),
    ).toBeVisible();
  });

  it('renders the excerpt when provided', () => {
    setup({ excerpt: 'A walkthrough of Atomic Design with Tailwind.' });
    expect(
      screen.getByText('A walkthrough of Atomic Design with Tailwind.'),
    ).toBeVisible();
  });

  it('does not render an excerpt element when excerpt is omitted', () => {
    setup();
    expect(
      screen.queryByText('A walkthrough of Atomic Design with Tailwind.'),
    ).not.toBeInTheDocument();
  });

  it('renders all provided tags', () => {
    setup({ tags: ['Design', 'Tailwind', 'React'] });
    expect(screen.getByText('Design')).toBeVisible();
    expect(screen.getByText('Tailwind')).toBeVisible();
    expect(screen.getByText('React')).toBeVisible();
  });

  it('does not render the tags container when tags is omitted', () => {
    setup();
    expect(screen.queryByText('Design')).not.toBeInTheDocument();
  });

  it('renders Hero.Cta children', () => {
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Cta>
          <a href="/posts/design-system">Read more</a>
        </Hero.Cta>
      </Hero>,
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/design-system',
    );
    expect(screen.getByText('Read more')).toBeVisible();
  });

  it('nests the CTA inside the copy column, alongside the heading', () => {
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Cta>
          <a href="/posts/design-system">Read more</a>
        </Hero.Cta>
      </Hero>,
    );
    const copyColumn = screen.getByTestId('hero-copy');
    expect(copyColumn).toContainElement(
      screen.getByRole('heading', { name: 'Building a Design System' }),
    );
    expect(copyColumn).toContainElement(screen.getByRole('link'));
  });

  it('does not render a CTA when Hero.Cta is omitted', () => {
    setup();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders Hero.Media content', () => {
    renderElement(
      <Hero title="Building a Design System" titleId="hero-title">
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );
    expect(screen.getByAltText('Hero cover photo')).toBeVisible();
  });

  it('does not render media when Hero.Media is omitted', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('labels the section via the title heading, not a redundant string', () => {
    const { container } = setup();
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'hero-title');
    expect(
      screen.getByRole('heading', { name: 'Building a Design System' }),
    ).toHaveAttribute('id', 'hero-title');
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: 'featured-hero' });
    expect(screen.getByTestId('featured-hero')).toBeVisible();
  });
});
