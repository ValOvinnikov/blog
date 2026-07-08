import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';

import { LinkButton } from './link-button';

describe(`<${LinkButton.name}/>`, () => {
  it('renders an anchor by default', () => {
    render(<LinkButton href="/blog">Read more</LinkButton>);

    expect(screen.getByRole('link', { name: 'Read more' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('supports custom link components through as', () => {
    const CustomLink = ({
      href,
      ...rest
    }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a data-custom-link="true" href={href} {...rest} />
    );

    render(
      <LinkButton as={CustomLink} href="/about">
        About
      </LinkButton>,
    );

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'data-custom-link',
      'true',
    );
  });

  it('forwards data-testid', () => {
    render(
      <LinkButton href="/blog" dataTestId="blog-link">
        Blog
      </LinkButton>,
    );

    expect(screen.getByTestId('blog-link')).toBeVisible();
  });
});
