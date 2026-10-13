import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';

import { buildNeutralShell } from './neutral-shell';

describe(buildNeutralShell, () => {
  describe('with only a title and body HTML', () => {
    let html: string;

    beforeEach(() => {
      html = buildNeutralShell({
        title: 'Sign in',
        bodyHtml: '<p>Body</p>',
      });
    });

    it('wraps the body in a full HTML document', () => {
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<p>Body</p>');
    });

    it('titles the document with the given title', () => {
      expect(html).toContain('<title>Sign in</title>');
    });

    it('renders no brand header and no footer', () => {
      expect(html).not.toContain('<svg');
      expect(html).not.toContain('<img');
      expect(html).not.toContain('&copy;');
      expect(html).not.toContain('border-top');
    });

    it('renders no operator branding', () => {
      expect(html).not.toContain('Tenant Alerts');
      expect(html).not.toContain(PLATFORM_EMAIL_BRAND.surface2);
    });

    it('renders no preheader when no preview text is given', () => {
      expect(html).not.toContain('display:none');
    });
  });

  it('escapes the title', () => {
    const html = buildNeutralShell({
      title: '<script>alert(1)</script>',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('renders structural and action HTML after the body', () => {
    const html = buildNeutralShell({
      title: 'Sign in',
      bodyHtml: '<p>Body</p>',
      structuralHtml: '<p>Structural</p>',
      actionHtml: '<a href="https://example.com">Act</a>',
    });

    const bodyIndex = html.indexOf('<p>Body</p>');
    const structuralIndex = html.indexOf('<p>Structural</p>');
    const actionIndex = html.indexOf('<a href="https://example.com">Act</a>');

    expect(bodyIndex).toBeLessThan(structuralIndex);
    expect(structuralIndex).toBeLessThan(actionIndex);
  });

  it('cannot be passed a brand name at compile time', () => {
    const html = buildNeutralShell({
      title: 'Sign in',
      // @ts-expect-error -- an unresolved tenant has no defensible name, so the neutral shell accepts none.
      brandName: 'Tenant Alerts',
      bodyHtml: '<p>Body</p>',
    });

    expect(html).not.toContain('Tenant Alerts');
  });

  it('cannot be passed a brand palette at compile time', () => {
    const html = buildNeutralShell({
      title: 'Sign in',
      // @ts-expect-error -- the neutral shell's palette is fixed, so no tenant or operator palette can reach it.
      brand: PLATFORM_EMAIL_BRAND,
      bodyHtml: '<p>Body</p>',
    });

    expect(html).not.toContain(PLATFORM_EMAIL_BRAND.surface2);
  });
});
