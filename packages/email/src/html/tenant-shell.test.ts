import { buildTenantShell, type TTenantEmailBrand } from './tenant-shell';

const BRAND: TTenantEmailBrand = {
  surface: '#ffffff',
  surface2: '#f8f8fb',
  border: '#e4e4ec',
  text: '#1f1f2b',
  textMuted: '#6b6b7a',
  brandPrimary: '#3355dd',
  brandPrimarySolid: '#3355dd',
  brandPrimaryContrast: '#ffffff',
  logo1: '#3355dd',
  logo2: '#5577ee',
  logo3: '#88aaff',
};

describe('buildTenantShell', () => {
  it('wraps the given body HTML in a full HTML document', () => {
    const html = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme Blog',
      bodyHtml: '<p>Hello there.</p>',
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<p>Hello there.</p>');
  });

  it('passes bodyHtml through unescaped, since callers already escape their own interpolated values', () => {
    const html = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme',
      bodyHtml: '<p><a href="https://example.com">Confirm</a></p>',
    });

    expect(html).toContain('<a href="https://example.com">Confirm</a>');
  });

  it('escapes the brand name wherever it is interpolated', () => {
    const html = buildTenantShell({
      brand: BRAND,
      brandName: '<script>alert(1)</script>',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('includes a hidden preheader with the escaped preview text when given', () => {
    const html = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme',
      previewText: 'Confirm your <email>',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toContain('display:none');
    expect(html).toContain('Confirm your &lt;email&gt;');
  });

  it('omits the preheader block entirely when no preview text is given', () => {
    const html = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).not.toContain('display:none');
  });

  it('inlines the given brand hex tokens rather than referencing CSS custom properties', () => {
    const html = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toContain(BRAND.surface);
    expect(html).toContain(BRAND.border);
    expect(html).not.toContain('var(--');
  });

  it('renders a different tenant palette in the output for a different brand', () => {
    const otherBrand: TTenantEmailBrand = { ...BRAND, border: '#ff00ff' };

    const html = buildTenantShell({
      brand: otherBrand,
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toContain('#ff00ff');
    expect(html).not.toContain(BRAND.border);
  });

  it('renders the current year in the footer copyright line', () => {
    const html = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toContain(`&copy; ${new Date().getFullYear()} Acme`);
  });

  it('requires a brand at compile time', () => {
    function callWithoutBrand(): string {
      // @ts-expect-error -- buildTenantShell requires a resolved brand; a
      // tenant email must not silently fall back to the platform palette.
      return buildTenantShell({
        brandName: 'Acme',
        bodyHtml: '<p>Body</p>',
      });
    }

    expect(callWithoutBrand).toBeInstanceOf(Function);
  });
});
