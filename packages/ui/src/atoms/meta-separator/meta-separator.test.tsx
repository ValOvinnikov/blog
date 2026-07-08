import { render } from '@testing-library/react';

import { MetaSeparator } from './meta-separator';

describe(`<${MetaSeparator.name}/>`, () => {
  it('renders the default · character', () => {
    const { container } = render(<MetaSeparator />);
    expect(container.firstChild).toHaveTextContent('·');
  });

  it('renders a custom separator', () => {
    const { container } = render(<MetaSeparator separator="/" />);
    expect(container.firstChild).toHaveTextContent('/');
  });

  it('has aria-hidden="true"', () => {
    const { container } = render(<MetaSeparator />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('accepts className override', () => {
    const { container } = render(<MetaSeparator className="ml-1" />);
    expect((container.firstChild as HTMLElement).className).toContain('ml-1');
  });
});
