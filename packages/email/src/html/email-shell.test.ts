import { emailBrandTokens } from './brand-tokens';
import { buildEmailShell } from './email-shell';

describe('buildEmailShell', () => {
  it('wraps the given body HTML in a full HTML document', () => {
    const html = buildEmailShell({
      brandName: 'Acme Blog',
      bodyHtml: '<p>Hello there.</p>',
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<p>Hello there.</p>');
  });

  it('passes bodyHtml through unescaped, since callers already escape their own interpolated values', () => {
    const html = buildEmailShell({
      brandName: 'Acme',
      bodyHtml: '<p><a href="https://example.com">Confirm</a></p>',
    });

    expect(html).toContain('<a href="https://example.com">Confirm</a>');
  });

  it('escapes the brand name wherever it is interpolated', () => {
    const html = buildEmailShell({
      brandName: '<script>alert(1)</script>',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('includes a hidden preheader with the escaped preview text when given', () => {
    const html = buildEmailShell({
      brandName: 'Acme',
      previewText: 'Confirm your <email>',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toContain('display:none');
    expect(html).toContain('Confirm your &lt;email&gt;');
  });

  it('omits the preheader block entirely when no preview text is given', () => {
    const html = buildEmailShell({
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).not.toContain('display:none');
  });

  it('inlines the shared brand hex tokens rather than referencing CSS custom properties', () => {
    const html = buildEmailShell({
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toContain(emailBrandTokens.surface);
    expect(html).toContain(emailBrandTokens.border);
    expect(html).not.toContain('var(--');
  });

  it('renders the current year in the footer copyright line', () => {
    const html = buildEmailShell({
      brandName: 'Acme',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toContain(`&copy; ${new Date().getFullYear()} Acme`);
  });
});
