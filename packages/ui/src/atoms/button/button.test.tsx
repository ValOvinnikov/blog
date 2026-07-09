import { Size } from '@blog/config';
import { render, screen } from '@testing-library/react';

import { Button } from './button';

describe(`<${Button.name}/>`, () => {
  it('renders a button element', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeVisible();
  });

  it('forwards disabled attribute', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('keeps the primary text color alongside the size (regression: tailwind-merge must not strip text-accent-contrast)', () => {
    render(<Button variant="primary">Publish</Button>);
    const btn = screen.getByRole('button', { name: 'Publish' });
    expect(btn.className).toContain('text-accent-contrast');
    expect(btn.className).toContain('text-copy');
  });

  it('renders ghost variant with strong border', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn.className).toContain('border-border-strong');
  });

  it('renders link variant with underline', () => {
    render(<Button variant="link">Link</Button>);
    const btn = screen.getByRole('button', { name: 'Link' });
    expect(btn.className).toContain('underline');
  });

  it('renders sm size', () => {
    render(<Button size={Size.SM}>Small</Button>);
    expect(screen.getByRole('button', { name: 'Small' }).className).toContain(
      'px-3',
    );
  });

  it('renders lg size', () => {
    render(<Button size={Size.LG}>Large</Button>);
    expect(screen.getByRole('button', { name: 'Large' }).className).toContain(
      'px-5',
    );
  });
});
