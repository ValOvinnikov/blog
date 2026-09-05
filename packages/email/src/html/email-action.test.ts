import { renderEmailAction, type TEmailActionBrand } from './email-action';

const BRAND: TEmailActionBrand = {
  brandPrimary: '#3355dd',
  brandPrimarySolid: '#2244cc',
  brandPrimaryContrast: '#ffffff',
};

describe('renderEmailAction', () => {
  it('renders a button using the solid fill and contrast text colours', () => {
    const html = renderEmailAction(
      { label: 'Sign in', url: 'https://example.com/sign-in' },
      BRAND,
    );

    expect(html).toContain('href="https://example.com/sign-in"');
    expect(html).toContain('>Sign in</a>');
    expect(html).toContain(BRAND.brandPrimarySolid);
    expect(html).toContain(BRAND.brandPrimaryContrast);
  });

  it('uses a table for the button so it renders consistently across clients', () => {
    const html = renderEmailAction(
      { label: 'Accept invite', url: 'https://example.com/invite' },
      BRAND,
    );

    expect(html).toContain('<table');
  });

  it('renders the link variant using brandPrimary rather than the solid fill', () => {
    const html = renderEmailAction(
      {
        label: 'Unsubscribe',
        url: 'https://example.com/unsubscribe',
        variant: 'link',
      },
      BRAND,
    );

    expect(html).toContain(BRAND.brandPrimary);
    expect(html).not.toContain(BRAND.brandPrimarySolid);
  });

  it('escapes the label', () => {
    const html = renderEmailAction(
      { label: '<script>alert(1)</script>', url: 'https://example.com' },
      BRAND,
    );

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes the url', () => {
    const html = renderEmailAction(
      {
        label: 'Sign in',
        url: 'https://example.com/"><script>alert(1)</script>',
      },
      BRAND,
    );

    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
