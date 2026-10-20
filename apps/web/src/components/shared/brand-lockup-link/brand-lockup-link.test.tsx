import { customRender, screen, waitFor } from '@web/testing/custom-render';

import { BrandLockupLink } from './brand-lockup-link';

const LOGO_URL = 'https://blob.example.com/tenants/tenant-a/logo.svg';

const setup = customRender(BrandLockupLink, { logoUrl: LOGO_URL });

describe(`<${BrandLockupLink.name}/>`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a link home labelled "Home" wrapping the brand lockup', () => {
    setup();

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByRole('presentation')).toHaveAttribute('src', LOGO_URL);
  });

  it('falls through to the polygon mark when no logo is uploaded', () => {
    setup({ logoUrl: undefined });

    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Home' }),
    ).not.toBeEmptyDOMElement();
  });

  it('falls back to the polygon mark when the logo fails to load', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockRejectedValue(
      new Error('broken image'),
    );

    setup();

    await waitFor(() => {
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: 'Home' }),
    ).not.toBeEmptyDOMElement();
  });

  it('passes the tagline through to the brand lockup when set', () => {
    setup({ tagline: 'Est. 2026 · Berlin' });

    expect(screen.getByText('Est. 2026 · Berlin')).toBeVisible();
  });
});
