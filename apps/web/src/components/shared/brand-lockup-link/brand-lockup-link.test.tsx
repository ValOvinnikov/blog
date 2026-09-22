import { customRender, screen } from '@web/testing/custom-render';

import { BrandLockupLink } from './brand-lockup-link';

const LOGO_URL = 'https://cdn.sanity.io/images/test/production/brand-mark.svg';

const setup = customRender(BrandLockupLink, { logoUrl: LOGO_URL });

describe(`<${BrandLockupLink.name}/>`, () => {
  it('renders a link home labelled "Home" wrapping the brand lockup', () => {
    setup();

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByRole('presentation')).toHaveAttribute('src', LOGO_URL);
  });

  it('falls through to the polygon mark when no logo is uploaded', () => {
    setup({ logoUrl: undefined });

    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
  });

  it('passes the tagline through to the brand lockup when set', () => {
    setup({ tagline: 'Est. 2026 · Berlin' });

    expect(screen.getByText('Est. 2026 · Berlin')).toBeVisible();
  });
});
