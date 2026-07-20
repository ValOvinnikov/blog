import type { TBrand } from '@blog/service';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrandLockupLink } from './brand-lockup-link';

const brand: TBrand = {
  name: 'Test Brand',
  prefix: 'test',
  suffix: 'brand',
  logoUrl: undefined,
  specLine: undefined,
};

describe(`<${BrandLockupLink.name}/>`, () => {
  it('renders a link home labelled "Home" wrapping the brand lockup', () => {
    render(<BrandLockupLink brand={brand} />);

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByText(brand.prefix)).toBeVisible();
    expect(screen.getByText(brand.suffix as string)).toBeVisible();
  });

  it('passes the spec line through to the brand lockup when set', () => {
    render(
      <BrandLockupLink brand={{ ...brand, specLine: 'Est. 2026 · Berlin' }} />,
    );

    expect(screen.getByText('Est. 2026 · Berlin')).toBeVisible();
  });
});
