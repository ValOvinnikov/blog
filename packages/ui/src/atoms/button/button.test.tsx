import { Size } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';

import { Button } from './button';

const setup = customRender(Button, { children: 'Click me' });

describe(`<${Button.name}/>`, () => {
  it('renders a button element', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Click me' })).toBeVisible();
  });

  it('forwards disabled attribute', () => {
    setup({ disabled: true, children: 'Disabled' });
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('shows a pointer cursor on hover', () => {
    setup();
    expect(
      screen.getByRole('button', { name: 'Click me' }).className,
    ).toContain('cursor-pointer');
  });

  it('disables pointer events (and thus the pointer cursor) when disabled', () => {
    setup({ disabled: true, children: 'Disabled' });
    expect(
      screen.getByRole('button', { name: 'Disabled' }).className,
    ).toContain('disabled:pointer-events-none');
  });

  it('keeps the primary text color alongside the size (regression: tailwind-merge must not strip text-accent-contrast)', () => {
    setup({ variant: 'primary', children: 'Publish' });
    const btn = screen.getByRole('button', { name: 'Publish' });
    expect(btn.className).toContain('bg-accent-solid');
    expect(btn.className).toContain('text-accent-contrast');
    expect(btn.className).toContain('hover:bg-accent-solid-hover');
    expect(btn.className).toContain('text-copy');
  });

  it('renders ghost variant with strong border', () => {
    setup({ variant: 'ghost', children: 'Ghost' });
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn.className).toContain('border-border-strong');
  });

  it('renders link variant with underline', () => {
    setup({ variant: 'link', children: 'Link' });
    const btn = screen.getByRole('button', { name: 'Link' });
    expect(btn.className).toContain('underline');
  });

  it('renders sm size', () => {
    setup({ size: Size.SM, children: 'Small' });
    expect(screen.getByRole('button', { name: 'Small' }).className).toContain(
      'px-3',
    );
  });

  it('renders lg size', () => {
    setup({ size: Size.LG, children: 'Large' });
    expect(screen.getByRole('button', { name: 'Large' }).className).toContain(
      'px-5',
    );
  });
});
