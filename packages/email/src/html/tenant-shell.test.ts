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

  it('renders byte-identical output for an actionless email', () => {
    const html = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme',
      previewText: 'Preview text',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toMatchInlineSnapshot(
      `"<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Acme</title></head><body style="margin:0;padding:0;background-color:#f8f8fb;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">Preview text</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8fb;"><tr><td align="center" style="padding:32px 16px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e4e4ec;border-radius:8px;"><tr><td style="padding:24px 32px;border-bottom:1px solid #e4e4ec;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding-right:8px;"><svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true"><polygon points="12,3 22,7 12,11 2,7" fill="#3355dd" /><polygon points="12,8 22,12 12,16 2,12" fill="#5577ee" /><polygon points="12,13 22,17 12,21 2,17" fill="#88aaff" /></svg></td><td style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;font-size:18px;font-weight:700;color:#1f1f2b;">Acme</td></tr></table></td></tr><tr><td style="padding:32px;color:#1f1f2b;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;font-size:16px;line-height:1.5;"><p>Body</p></td></tr><tr><td style="padding:24px 32px;border-top:1px solid #e4e4ec;color:#6b6b7a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;font-size:12px;line-height:1.5;">&copy; 2026 Acme</td></tr></table></td></tr></table></body></html>"`,
    );
  });

  it('renders no actionHtml given for an email with no action', () => {
    const withoutActionHtml = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
    });
    const withUndefinedActionHtml = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
      actionHtml: undefined,
    });

    expect(withUndefinedActionHtml).toBe(withoutActionHtml);
  });

  it('renders actionHtml between the body and the footer when given', () => {
    const html = buildTenantShell({
      brand: BRAND,
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
      actionHtml: '<a href="https://example.com">Confirm</a>',
    });

    const bodyIndex = html.indexOf('<p>Body</p>');
    const actionIndex = html.indexOf(
      '<a href="https://example.com">Confirm</a>',
    );
    const footerIndex = html.indexOf('&copy;');

    expect(bodyIndex).toBeLessThan(actionIndex);
    expect(actionIndex).toBeLessThan(footerIndex);
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
