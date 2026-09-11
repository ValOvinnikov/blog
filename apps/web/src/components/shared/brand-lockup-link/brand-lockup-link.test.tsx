import { customRender, screen } from '@web/testing/custom-render';

import { BrandLockupLink } from './brand-lockup-link';

const LOGO_URL = 'https://cdn.sanity.io/images/test/production/brand-mark.svg';

const setup = customRender(BrandLockupLink, { logoUrl: LOGO_URL });

describe(`<${BrandLockupLink.name}/>`, () => {
  it('renders a link home labelled "Home" wrapping the brand lockup', () => {
    const { container } = setup();

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
    expect(container.querySelector('img')).toHaveAttribute('src', LOGO_URL);
  });

  it('falls through to the polygon mark when no logo is uploaded', () => {
    const { container } = setup({ logoUrl: undefined });

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('passes the spec line through to the brand lockup when set', () => {
    setup({ specLine: 'Est. 2026 · Berlin' });

    expect(screen.getByText('Est. 2026 · Berlin')).toBeVisible();
  });
});
