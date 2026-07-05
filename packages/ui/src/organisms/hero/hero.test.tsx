import { render, screen } from '@testing-library/react';

import { Hero } from './hero';

describe(`<${Hero.name}/>`, () => {
  it('renders the title', () => {
    render(<Hero title="Building a Design System" />);
    expect(
      screen.getByRole('heading', { name: 'Building a Design System' }),
    ).toBeVisible();
  });

  it('renders the excerpt when provided', () => {
    render(
      <Hero
        title="Building a Design System"
        excerpt="A walkthrough of Atomic Design with Tailwind."
      />,
    );
    expect(
      screen.getByText('A walkthrough of Atomic Design with Tailwind.'),
    ).toBeVisible();
  });

  it('does not render an excerpt element when excerpt is omitted', () => {
    render(<Hero title="Building a Design System" />);
    expect(
      screen.queryByText('A walkthrough of Atomic Design with Tailwind.'),
    ).not.toBeInTheDocument();
  });

  it('renders all provided tags', () => {
    render(
      <Hero
        title="Building a Design System"
        tags={['Design', 'Tailwind', 'React']}
      />,
    );
    expect(screen.getByText('Design')).toBeVisible();
    expect(screen.getByText('Tailwind')).toBeVisible();
    expect(screen.getByText('React')).toBeVisible();
  });

  it('does not render the tags container when tags is omitted', () => {
    render(<Hero title="Building a Design System" />);
    expect(screen.queryByText('Design')).not.toBeInTheDocument();
  });

  it('renders Hero.Cta with the correct href', () => {
    render(
      <Hero title="Building a Design System">
        <Hero.Cta href="/posts/design-system">Read more</Hero.Cta>
      </Hero>,
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/design-system',
    );
  });

  it('renders Hero.Cta children as the label', () => {
    render(
      <Hero title="Building a Design System">
        <Hero.Cta href="/posts/design-system">View post</Hero.Cta>
      </Hero>,
    );
    expect(screen.getByText('View post')).toBeVisible();
  });

  it('renders Hero.Cta as a custom element when `as` is provided', () => {
    const CustomLink = ({
      href,
      children,
      ...rest
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} data-custom="true" {...rest}>
        {children}
      </a>
    );
    render(
      <Hero title="Building a Design System">
        <Hero.Cta as={CustomLink} href="/posts/design-system">
          Read more
        </Hero.Cta>
      </Hero>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('data-custom', 'true');
  });

  it('does not render a CTA when Hero.Cta is omitted', () => {
    render(<Hero title="Building a Design System" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders Hero.Media content', () => {
    render(
      <Hero title="Building a Design System">
        <Hero.Media>
          <img src="/img/hero.jpg" alt="Hero cover photo" />
        </Hero.Media>
      </Hero>,
    );
    expect(screen.getByAltText('Hero cover photo')).toBeVisible();
  });

  it('does not render media when Hero.Media is omitted', () => {
    render(<Hero title="Building a Design System" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('forwards className to the root element', () => {
    render(<Hero title="Building a Design System" className="custom-hero" />);
    expect(
      screen.getByRole('region', { name: 'Featured post' }).className,
    ).toContain('custom-hero');
  });

  it('forwards data-testid to the root element', () => {
    render(
      <Hero title="Building a Design System" dataTestId="featured-hero" />,
    );
    expect(screen.getByTestId('featured-hero')).toBeVisible();
  });
});
