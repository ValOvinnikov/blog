import { buildOperatorShell } from './operator-shell';
import { PLATFORM_EMAIL_BRAND } from './platform-email-brand';

describe('buildOperatorShell', () => {
  it('wraps the given body HTML in a full HTML document', () => {
    const html = buildOperatorShell({ bodyHtml: '<p>Hello there.</p>' });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<p>Hello there.</p>');
  });

  it('passes bodyHtml through unescaped, since callers already escape their own interpolated values', () => {
    const html = buildOperatorShell({
      bodyHtml: '<p><a href="https://example.com">Confirm</a></p>',
    });

    expect(html).toContain('<a href="https://example.com">Confirm</a>');
  });

  it('names the platform in the header and footer', () => {
    const html = buildOperatorShell({ bodyHtml: '<p>Body</p>' });

    expect(html).toContain('Tenant Alerts');
    expect(html).toContain(`&copy; ${new Date().getFullYear()} Tenant Alerts`);
  });

  it('includes a hidden preheader with the escaped preview text when given', () => {
    const html = buildOperatorShell({
      previewText: 'Needs <attention>',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toContain('display:none');
    expect(html).toContain('Needs &lt;attention&gt;');
  });

  it('omits the preheader block entirely when no preview text is given', () => {
    const html = buildOperatorShell({ bodyHtml: '<p>Body</p>' });

    expect(html).not.toContain('display:none');
  });

  it('inlines the fixed platform hex tokens rather than referencing CSS custom properties', () => {
    const html = buildOperatorShell({ bodyHtml: '<p>Body</p>' });

    expect(html).toContain(PLATFORM_EMAIL_BRAND.surface);
    expect(html).toContain(PLATFORM_EMAIL_BRAND.border);
    expect(html).not.toContain('var(--');
  });

  it('cannot be passed a tenant brand at compile time', () => {
    const html = buildOperatorShell({
      // @ts-expect-error -- buildOperatorShell has no brand parameter, so a
      // resolved tenant palette must not be assignable to it.
      brand: { surface: '#ffffff' },
      previewText: 'Alert',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).toContain('<!doctype html>');
  });
});
