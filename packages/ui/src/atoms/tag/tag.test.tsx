import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';

import { Tag } from './tag';

describe(`<${Tag.name}/>`, () => {
  it('renders a span element', () => {
    render(<Tag>Label</Tag>);
    expect(screen.getByText('Label').tagName).toBe('SPAN');
  });

  it('default variant has a border', () => {
    render(<Tag>Label</Tag>);
    expect(screen.getByText('Label').className).toContain('border');
  });

  it('accent variant applies accent-muted background', () => {
    render(<Tag variant="accent">Label</Tag>);
    expect(screen.getByText('Label').className).toContain('bg-accent-muted');
  });

  it('renders as an anchor when `as` is set to "a"', () => {
    render(
      <Tag as="a" href="/category/architecture">
        Architecture
      </Tag>,
    );
    expect(screen.getByRole('link', { name: 'Architecture' })).toHaveAttribute(
      'href',
      '/category/architecture',
    );
  });

  it('renders with a custom component when `as` prop is provided', () => {
    const CustomLink = ({
      href,
      children,
      ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} data-custom="true" {...props}>
        {children}
      </a>
    );
    render(
      <Tag as={CustomLink} href="/custom">
        Custom
      </Tag>,
    );
    const link = screen.getByRole('link', { name: 'Custom' });
    expect(link).toHaveAttribute('data-custom', 'true');
    expect(link).toHaveAttribute('href', '/custom');
  });
});
