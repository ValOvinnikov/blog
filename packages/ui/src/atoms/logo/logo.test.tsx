import { render, screen } from '@testing-library/react';

import { Logo } from './logo';

describe(`<${Logo.name}/>`, () => {
  it('renders prefix text', () => {
    render(<Logo prefix="Val." />);
    expect(screen.getByText('Val.')).toBeVisible();
  });

  it('renders suffix with text-accent class when provided', () => {
    render(<Logo prefix="Val." suffix="dev" />);
    const suffixEl = screen.getByText('dev');
    expect(suffixEl).toBeVisible();
    expect(suffixEl.className).toContain('text-accent');
  });

  it('renders suffix with the same font-weight as the prefix', () => {
    render(<Logo prefix="Val." suffix="dev" />);
    const prefixEl = screen.getByText('Val.');
    const suffixEl = screen.getByText('dev');
    expect(suffixEl.className).toContain('font-medium');
    expect(prefixEl.className).toContain('font-medium');
    expect(suffixEl.className).not.toContain('font-normal');
  });

  it('renders without suffix span when suffix is omitted', () => {
    const { container } = render(<Logo prefix="Val." />);
    // root span only; no nested span for suffix
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(1);
  });
});
