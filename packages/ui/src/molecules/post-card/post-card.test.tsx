import { render, screen } from '@testing-library/react';

import { PostCard } from './post-card';

const DEFAULTS = {
  title: 'Hello World',
  href: '/posts/hello-world',
};

describe(`<${PostCard.name}/>`, () => {
  it('renders the title', () => {
    render(<PostCard {...DEFAULTS} />);
    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeVisible();
  });

  it('wraps the title in a link with the correct href', () => {
    render(<PostCard {...DEFAULTS} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/hello-world',
    );
  });

  it('renders excerpt when provided', () => {
    render(<PostCard {...DEFAULTS} excerpt="A short summary." />);
    expect(screen.getByText('A short summary.')).toBeVisible();
  });

  it('does not render excerpt element when omitted', () => {
    render(<PostCard {...DEFAULTS} />);
    expect(screen.queryByText(/summary/i)).not.toBeInTheDocument();
  });

  it('renders all provided tags', () => {
    render(<PostCard {...DEFAULTS} tags={['react', 'typescript']} />);
    expect(screen.getByText('react')).toBeVisible();
    expect(screen.getByText('typescript')).toBeVisible();
  });

  it('does not render tags area when tags is empty', () => {
    const { container } = render(<PostCard {...DEFAULTS} tags={[]} />);
    expect(container.querySelectorAll('span[class]').length).toBe(0);
  });

  it('renders author name when provided', () => {
    render(<PostCard {...DEFAULTS} authorName="Jane Doe" />);
    const visibleName = screen
      .getAllByText('Jane Doe')
      .find((el) => !el.classList.contains('sr-only'));
    expect(visibleName).toBeVisible();
  });

  it('does not render author section when authorName is omitted', () => {
    render(<PostCard {...DEFAULTS} />);
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('renders cover image with correct alt text', () => {
    render(
      <PostCard
        {...DEFAULTS}
        coverImage={{ src: '/cover.jpg', alt: 'Cover photo' }}
      />,
    );
    expect(screen.getByRole('img', { name: 'Cover photo' })).toBeVisible();
  });

  it('does not render cover image when omitted', () => {
    render(<PostCard {...DEFAULTS} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders a time element with the correct dateTime attribute', () => {
    const iso = '2024-01-15T00:00:00Z';
    render(<PostCard {...DEFAULTS} publishedAt={iso} />);
    const timeEl = screen.getByRole('time');
    expect(timeEl).toBeVisible();
    expect(timeEl).toHaveAttribute('dateTime', iso);
  });

  it('does not render time element when publishedAt is omitted', () => {
    render(<PostCard {...DEFAULTS} />);
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('forwards className to root element', () => {
    const { container } = render(
      <PostCard {...DEFAULTS} className="extra-class" />,
    );
    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('forwards data-testid to root element', () => {
    render(<PostCard {...DEFAULTS} dataTestId="post-card" />);
    expect(screen.getByTestId('post-card')).toBeVisible();
  });
});
