import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { Eyebrow } from './eyebrow';

describe(`<${Eyebrow.name}/>`, () => {
  it('renders children', () => {
    render(<Eyebrow>Featured Post</Eyebrow>);
    expect(screen.getByText('Featured Post')).toBeVisible();
  });

  it('renders as a <p> element', () => {
    const { container } = render(<Eyebrow>Label</Eyebrow>);
    expect(container.firstChild?.nodeName).toBe('P');
  });

  it('renders as a link when href is provided', () => {
    render(<Eyebrow href="/category/engineering">Engineering</Eyebrow>);
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'href',
      '/category/engineering',
    );
  });

  it('renders using the custom linkAs component when href is provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-custom="true">
        {children}
      </a>
    );
    render(
      <Eyebrow href="/category/engineering" linkAs={CustomLink}>
        Engineering
      </Eyebrow>,
    );
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'data-custom',
      'true',
    );
  });

  it('forwards dataTestId to the root element', () => {
    render(<Eyebrow dataTestId="eyebrow">Featured Post</Eyebrow>);
    expect(screen.getByTestId('eyebrow')).toBeVisible();
  });
});
