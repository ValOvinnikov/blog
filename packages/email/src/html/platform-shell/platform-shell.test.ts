import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import {
  MOCK_BODY_HTML,
  MOCK_EMAIL_SUBJECT,
  MOCK_LINK_HTML,
  MOCK_PLATFORM_BRAND_NAME,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import { buildPlatformShell } from './platform-shell';

const UNSAFE_BRAND_NAME = '<b>Brand</b>';
const UNSAFE_TITLE = '<i>Title</i>';

describe(buildPlatformShell, () => {
  describe('with a brand name, title and body HTML', () => {
    let html: string;

    beforeEach(() => {
      html = buildPlatformShell({
        brandName: MOCK_PLATFORM_BRAND_NAME,
        title: MOCK_EMAIL_SUBJECT,
        bodyHtml: MOCK_BODY_HTML,
      });
    });

    it('wraps the body in a full HTML document titled with the title', () => {
      expect(html).toContain('<!doctype html>');
      expect(html).toContain(`<title>${MOCK_EMAIL_SUBJECT}</title>`);
      expect(html).toContain(MOCK_BODY_HTML);
    });

    it('names the brand in the header and the copyright line', () => {
      expect(html).toContain(
        `&copy; ${new Date().getFullYear()} ${MOCK_PLATFORM_BRAND_NAME}`,
      );
    });

    it('renders in the fixed platform palette', () => {
      expect(html).toContain(PLATFORM_EMAIL_BRAND.surface2);
      expect(html).toContain(PLATFORM_EMAIL_BRAND.logo1);
    });
  });

  it('escapes the brand name and the title', () => {
    const html = buildPlatformShell({
      brandName: UNSAFE_BRAND_NAME,
      title: UNSAFE_TITLE,
      bodyHtml: MOCK_BODY_HTML,
    });

    expect(html).not.toContain(UNSAFE_BRAND_NAME);
    expect(html).not.toContain(UNSAFE_TITLE);
    expect(html).toContain('&lt;b&gt;Brand&lt;/b&gt;');
    expect(html).toContain('&lt;i&gt;Title&lt;/i&gt;');
  });

  it('renders the action HTML after the body', () => {
    const html = buildPlatformShell({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      title: 'Title',
      bodyHtml: MOCK_BODY_HTML,
      actionHtml: MOCK_LINK_HTML,
    });

    expect(html.indexOf(MOCK_BODY_HTML)).toBeLessThan(
      html.indexOf(MOCK_LINK_HTML),
    );
  });

  it('cannot be passed a tenant brand at compile time', () => {
    const html = buildPlatformShell({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      title: 'Title',
      // @ts-expect-error -- the platform shell's palette is fixed, so no tenant palette can reach it.
      brand: MOCK_TENANT_EMAIL_BRAND,
      bodyHtml: MOCK_BODY_HTML,
    });

    expect(html).not.toContain(MOCK_TENANT_EMAIL_BRAND.surface2);
  });
});
