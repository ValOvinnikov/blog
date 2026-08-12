import { BRAND_VARIANTS } from '@blog/config';
import type { TBrand } from '@blog/service';
import { customRender, screen } from '@web/testing/custom-render';

import { BrandLockupLink } from './brand-lockup-link';

const brand: TBrand = {
  name: 'Test Brand',
  logoUrl: 'https://cdn.sanity.io/images/test/production/brand-mark.svg',
  logoAsset: undefined,
  specLine: undefined,
  variant: BRAND_VARIANTS.CONSOLE,
};

const setup = customRender(BrandLockupLink, { brand });

describe(`<${BrandLockupLink.name}/>`, () => {
  it('renders a link home labelled "Home" wrapping the brand lockup', () => {
    const { container } = setup();

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      brand.logoUrl,
    );
  });

  it('falls through to the polygon mark when no logo is uploaded', () => {
    const { container } = setup({ brand: { ...brand, logoUrl: undefined } });

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('passes the spec line through to the brand lockup when set', () => {
    setup({ brand: { ...brand, specLine: 'Est. 2026 · Berlin' } });

    expect(screen.getByText('Est. 2026 · Berlin')).toBeVisible();
  });
});
