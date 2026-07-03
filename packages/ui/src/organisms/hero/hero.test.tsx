import { render, screen } from '@testing-library/react';

import { Hero } from './hero';

const defaultProps = {
  title: 'Building a Design System',
  href: '/posts/design-system',
};

describe(`<${Hero.name}/>`, () => {
  it('renders the title', () => {
    render(<Hero {...defaultProps} />);
    expect(
      screen.getByRole('heading', { name: 'Building a Design System' }),
    ).toBeVisible();
  });

  it('renders the excerpt when provided', () => {
    render(
      <Hero
        {...defaultProps}
        excerpt="A walkthrough of Atomic Design with Tailwind."
      />,
    );
    expect(
      screen.getByText('A walkthrough of Atomic Design with Tailwind.'),
    ).toBeVisible();
  });

  it('does not render an excerpt element when excerpt is omitted', () => {
    render(<Hero {...defaultProps} />);
    expect(
      screen.queryByText('A walkthrough of Atomic Design with Tailwind.'),
    ).not.toBeInTheDocument();
  });

  it('renders all provided tags', () => {
    render(<Hero {...defaultProps} tags={['Design', 'Tailwind', 'React']} />);
    expect(screen.getByText('Design')).toBeVisible();
    expect(screen.getByText('Tailwind')).toBeVisible();
    expect(screen.getByText('React')).toBeVisible();
  });

  it('does not render the tags container when tags is omitted', () => {
    render(<Hero {...defaultProps} />);
    expect(screen.queryByText('Design')).not.toBeInTheDocument();
  });

  it('renders the CTA link with the correct href', () => {
    render(<Hero {...defaultProps} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/design-system',
    );
  });

  it('renders the default CTA label "Read more"', () => {
    render(<Hero {...defaultProps} />);
    expect(screen.getByText('Read more')).toBeVisible();
  });

  it('renders a custom CTA label when ctaLabel is provided', () => {
    render(<Hero {...defaultProps} ctaLabel="View post" />);
    expect(screen.getByText('View post')).toBeVisible();
  });

  it('renders the cover image with the correct alt text', () => {
    render(
      <Hero
        {...defaultProps}
        coverImage={{ src: '/img/hero.jpg', alt: 'Hero cover photo' }}
      />,
    );
    expect(screen.getByAltText('Hero cover photo')).toBeVisible();
  });

  it('does not render an image when coverImage is omitted', () => {
    render(<Hero {...defaultProps} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('forwards className to the root element', () => {
    render(<Hero {...defaultProps} className="custom-hero" />);
    expect(
      screen.getByRole('region', { name: 'Featured post' }).className,
    ).toContain('custom-hero');
  });

  it('forwards data-testid to the root element', () => {
    render(<Hero {...defaultProps} dataTestId="featured-hero" />);
    expect(screen.getByTestId('featured-hero')).toBeVisible();
  });
});
