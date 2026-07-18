import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { BrandLockup } from './brand-lockup';

faker.seed(123);

describe(`<${BrandLockup.name}/>`, () => {
  it('renders the mark and the fixed wordmark', () => {
    const { container } = render(<BrandLockup />);
    expect(container.querySelectorAll('polygon')).toHaveLength(3);
    expect(screen.getByText('BRAND')).toBeVisible();
  });

  it('renders the mark decoratively — no accessible role or name', () => {
    render(<BrandLockup />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not render a spec line by default', () => {
    const specLine = faker.hacker.phrase();
    render(<BrandLockup specLine={specLine} />);
    expect(screen.queryByText(specLine)).not.toBeInTheDocument();
  });

  it('does not render a spec line when showSpec is set without specLine text', () => {
    const { container } = render(<BrandLockup showSpec />);
    expect(container.textContent).toBe('BRAND');
  });

  it('renders the spec line when showSpec and specLine are both set', () => {
    const specLine = faker.hacker.phrase();
    render(<BrandLockup showSpec specLine={specLine} />);
    expect(screen.getByText(specLine)).toBeVisible();
  });

  it('forwards the indigo variant to the mark', () => {
    const { container } = render(<BrandLockup variant="indigo" />);
    const firstPolygon = container.querySelector('polygon');
    expect(firstPolygon).toHaveStyle({ fill: 'var(--logo-alt-1)' });
  });
});
