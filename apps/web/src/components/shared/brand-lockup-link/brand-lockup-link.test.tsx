import { BRAND_VARIANTS } from '@blog/config';
import type { TBrand } from '@blog/service';
import { customRender, screen } from '@web/testing/custom-render';

import { BrandLockupLink } from './brand-lockup-link';

const brand: TBrand = {
  name: 'Test Brand',
  prefix: 'test',
  suffix: 'brand',
  logoUrl: undefined,
  specLine: undefined,
  variant: BRAND_VARIANTS.CONSOLE,
};

const setup = customRender(BrandLockupLink, { brand });

describe(`<${BrandLockupLink.name}/>`, () => {
  it('renders a link home labelled "Home" wrapping the brand lockup', () => {
    setup();

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByText(brand.prefix)).toBeVisible();
    expect(screen.getByText(brand.suffix as string)).toBeVisible();
  });

  it('passes the spec line through to the brand lockup when set', () => {
    setup({ brand: { ...brand, specLine: 'Est. 2026 · Berlin' } });

    expect(screen.getByText('Est. 2026 · Berlin')).toBeVisible();
  });
});
