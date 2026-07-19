import type { TBrand } from '@blog/service';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrandChipLink } from './brand-chip-link';

const brand: TBrand = {
  name: 'Test Brand',
  prefix: 'test',
  suffix: 'brand',
  logoUrl: undefined,
};

describe(`<${BrandChipLink.name}/>`, () => {
  it('renders a link home labelled "Home" wrapping the terminal chip', () => {
    render(<BrandChipLink brand={brand} />);

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByText(`${brand.prefix}${brand.suffix}`)).toBeVisible();
  });

  it('renders without the blinking cursor', () => {
    const { container } = render(<BrandChipLink brand={brand} />);

    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });
});
