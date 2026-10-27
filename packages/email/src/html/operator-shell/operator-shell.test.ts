import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import {
  COPYRIGHT_ENTITY,
  DOCTYPE,
  MOCK_BODY_HTML,
  MOCK_ESCAPED_SCRIPT_MARKUP,
  MOCK_LINK_HTML,
  MOCK_NOW,
  MOCK_SCRIPT_MARKUP,
  OPERATOR_BRAND_NAME,
  PREHEADER_STYLE,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import { buildOperatorShell } from './operator-shell';

describe(buildOperatorShell, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_NOW });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with only body HTML', () => {
    let html: string;

    beforeEach(() => {
      html = buildOperatorShell({ bodyHtml: MOCK_BODY_HTML });
    });

    it('wraps the body in a full English HTML document', () => {
      expect(html).toContain(DOCTYPE);
      expect(html).toContain('<html lang="en">');
      expect(html).toContain(MOCK_BODY_HTML);
    });

    it('names the operator and the current year in the copyright line', () => {
      expect(html).toContain(
        `${COPYRIGHT_ENTITY} ${MOCK_NOW.getFullYear()} ${OPERATOR_BRAND_NAME}`,
      );
    });

    it('omits the preheader when no preview text is given', () => {
      expect(html).not.toContain(PREHEADER_STYLE);
    });

    it('inlines the platform palette as hex values', () => {
      expect(html).toContain(PLATFORM_EMAIL_BRAND.surface);
      expect(html).toContain(PLATFORM_EMAIL_BRAND.border);
      expect(html).not.toContain('var(--');
    });
  });

  it('leaves the body HTML unescaped', () => {
    const html = buildOperatorShell({ bodyHtml: `<p>${MOCK_LINK_HTML}</p>` });

    expect(html).toContain(MOCK_LINK_HTML);
  });

  it('renders the escaped preview text in a hidden preheader', () => {
    const html = buildOperatorShell({
      previewText: MOCK_SCRIPT_MARKUP,
      bodyHtml: MOCK_BODY_HTML,
    });

    expect(html).toContain(PREHEADER_STYLE);
    expect(html).toContain(MOCK_ESCAPED_SCRIPT_MARKUP);
  });

  it('cannot be passed a tenant brand at compile time', () => {
    const html = buildOperatorShell({
      // @ts-expect-error -- the operator shell takes no brand, so a resolved tenant palette is not assignable to it.
      brand: MOCK_TENANT_EMAIL_BRAND,
      bodyHtml: MOCK_BODY_HTML,
    });

    expect(html).not.toContain(MOCK_TENANT_EMAIL_BRAND.surface2);
  });
});
