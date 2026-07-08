import { render, screen } from '@testing-library/react';

import { Caption } from './caption';

describe(`<${Caption.name}/>`, () => {
  it('renders as a <figcaption> element', () => {
    const { container } = render(<Caption />);
    expect(container.firstChild?.nodeName).toBe('FIGCAPTION');
  });

  it('forwards HTML attributes', () => {
    const { container } = render(<Caption data-testid="caption" />);
    expect(container.firstChild).toHaveAttribute('data-testid', 'caption');
  });

  it('renders children', () => {
    render(<Caption>Photo by Jane Doe</Caption>);
    expect(screen.getByText('Photo by Jane Doe')).toBeVisible();
  });
});
