import { customRender, screen } from '@blog/ui/testing/custom-render';

import { Logo } from './logo';

const setup = customRender(Logo, { prefix: 'Val.' });

describe(`<${Logo.name}/>`, () => {
  it('renders prefix text', () => {
    setup();
    expect(screen.getByText('Val.')).toBeVisible();
  });

  it('renders suffix with text-accent class when provided', () => {
    setup({ suffix: 'dev' });
    const suffixEl = screen.getByText('dev');
    expect(suffixEl).toBeVisible();
    expect(suffixEl.className).toContain('text-accent');
  });

  it('renders suffix with the same font-weight as the prefix', () => {
    setup({ suffix: 'dev' });
    const prefixEl = screen.getByText('Val.');
    const suffixEl = screen.getByText('dev');
    expect(suffixEl.className).toContain('font-medium');
    expect(prefixEl.className).toContain('font-medium');
    expect(suffixEl.className).not.toContain('font-normal');
  });

  it('renders without suffix span when suffix is omitted', () => {
    const { container } = setup();
    // root span only; no nested span for suffix
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(1);
  });
});
