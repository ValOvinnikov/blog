import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import {
  COPYRIGHT_ENTITY,
  DOCTYPE,
  MOCK_BODY_HTML,
  MOCK_EMAIL_SUBJECT,
  MOCK_ESCAPED_SCRIPT_MARKUP,
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_LINK_HTML,
  MOCK_NOW,
  MOCK_PLATFORM_BRAND_NAME,
  MOCK_SCRIPT_MARKUP,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import { buildPlatformShell } from './platform-shell';

describe(buildPlatformShell, () => {
  describe('with a brand name, title and body HTML', () => {
    let html: string;

    beforeEach(() => {
      vi.useFakeTimers({ now: MOCK_NOW });
      html = buildPlatformShell({
        brandName: MOCK_PLATFORM_BRAND_NAME,
        title: MOCK_EMAIL_SUBJECT,
        bodyHtml: MOCK_BODY_HTML,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('wraps the body in a full HTML document titled with the title', () => {
      expect(html).toContain(DOCTYPE);
      expect(html).toContain(`<title>${MOCK_EMAIL_SUBJECT}</title>`);
      expect(html).toContain(MOCK_BODY_HTML);
    });

    it('names the brand and the current year in the copyright line', () => {
      expect(html).toContain(
        `${COPYRIGHT_ENTITY} ${MOCK_NOW.getFullYear()} ${MOCK_PLATFORM_BRAND_NAME}`,
      );
    });

    it('renders in the fixed platform palette', () => {
      expect(html).toContain(PLATFORM_EMAIL_BRAND.surface2);
      expect(html).toContain(PLATFORM_EMAIL_BRAND.logo1);
    });
  });

  it('escapes the brand name and the title', () => {
    const html = buildPlatformShell({
      brandName: MOCK_SCRIPT_MARKUP,
      title: MOCK_UNSAFE_MARKUP,
      bodyHtml: MOCK_BODY_HTML,
    });

    expect(html).not.toContain(MOCK_SCRIPT_MARKUP);
    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_SCRIPT_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });

  it('renders the action HTML after the body', () => {
    const html = buildPlatformShell({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      title: MOCK_EMAIL_SUBJECT,
      bodyHtml: MOCK_BODY_HTML,
      actionHtml: MOCK_LINK_HTML,
    });

    const bodyIndex = html.indexOf(MOCK_BODY_HTML);
    const actionIndex = html.indexOf(MOCK_LINK_HTML);

    expect(bodyIndex).toBeLessThan(actionIndex);
  });

  it('cannot be passed a tenant brand at compile time', () => {
    const html = buildPlatformShell({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      title: MOCK_EMAIL_SUBJECT,
      // @ts-expect-error -- the platform shell's palette is fixed, so no tenant palette can reach it.
      brand: MOCK_TENANT_EMAIL_BRAND,
      bodyHtml: MOCK_BODY_HTML,
    });

    expect(html).not.toContain(MOCK_TENANT_EMAIL_BRAND.surface2);
  });
});
