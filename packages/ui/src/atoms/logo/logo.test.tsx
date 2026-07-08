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

  it('renders without suffix span when suffix is omitted', () => {
    const { container } = render(<Logo prefix="Val." />);
    // root span only; no nested span for suffix
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(1);
  });
});
