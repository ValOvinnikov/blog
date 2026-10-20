import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import { TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import { buildPlatformShell } from './platform-shell';

describe(buildPlatformShell, () => {
  describe('with a brand name, title and body HTML', () => {
    let html: string;

    beforeEach(() => {
      html = buildPlatformShell({
        brandName: 'Inkwell',
        title: 'Your site is ready',
        bodyHtml: '<p>Body</p>',
      });
    });

    it('wraps the body in a full HTML document titled with the title', () => {
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<title>Your site is ready</title>');
      expect(html).toContain('<p>Body</p>');
    });

    it('names the brand in the header and the copyright line', () => {
      expect(html).toContain(`&copy; ${new Date().getFullYear()} Inkwell`);
    });

    it('renders in the fixed platform palette', () => {
      expect(html).toContain(PLATFORM_EMAIL_BRAND.surface2);
      expect(html).toContain(PLATFORM_EMAIL_BRAND.logo1);
    });
  });

  it('escapes the brand name and the title', () => {
    const html = buildPlatformShell({
      brandName: '<b>Brand</b>',
      title: '<i>Title</i>',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).not.toContain('<b>Brand</b>');
    expect(html).not.toContain('<i>Title</i>');
    expect(html).toContain('&lt;b&gt;Brand&lt;/b&gt;');
    expect(html).toContain('&lt;i&gt;Title&lt;/i&gt;');
  });

  it('renders the action HTML after the body', () => {
    const html = buildPlatformShell({
      brandName: 'Inkwell',
      title: 'Title',
      bodyHtml: '<p>Body</p>',
      actionHtml: '<a href="https://example.com">Act</a>',
    });

    expect(html.indexOf('<p>Body</p>')).toBeLessThan(
      html.indexOf('<a href="https://example.com">Act</a>'),
    );
  });

  it('cannot be passed a tenant brand at compile time', () => {
    const html = buildPlatformShell({
      brandName: 'Inkwell',
      title: 'Title',
      // @ts-expect-error -- the platform shell's palette is fixed, so no tenant palette can reach it.
      brand: TENANT_EMAIL_BRAND,
      bodyHtml: '<p>Body</p>',
    });

    expect(html).not.toContain(TENANT_EMAIL_BRAND.surface2);
  });
});
