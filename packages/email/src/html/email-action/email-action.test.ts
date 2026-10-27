import {
  MOCK_DATA_URL,
  MOCK_EMAIL_ACTION,
  MOCK_ESCAPED_SCRIPT_MARKUP,
  MOCK_JAVASCRIPT_URL,
  MOCK_SCRIPT_MARKUP,
  MOCK_TAB_SPLIT_JAVASCRIPT_URL,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import { renderEmailAction } from './email-action';

const JAVASCRIPT_SCHEME = 'javascript:';

describe(renderEmailAction, () => {
  describe('as a button', () => {
    let html: string;

    beforeEach(() => {
      html = renderEmailAction(MOCK_EMAIL_ACTION, MOCK_TENANT_EMAIL_BRAND);
    });

    it('fills the button with the solid brand colour and its contrast text', () => {
      expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.brandPrimarySolid);
      expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.brandPrimaryContrast);
    });

    it('lays the button out as a table so every client renders it alike', () => {
      expect(html).toContain('<table');
    });

    it('makes the labelled link the whole content of the button cell', () => {
      expect(html).toMatch(
        new RegExp(
          `<td[^>]*><a href="${MOCK_EMAIL_ACTION.url}"[^>]*>${MOCK_EMAIL_ACTION.label}</a></td>`,
        ),
      );
    });
  });

  it('renders the link variant in the brand colour, not the solid fill', () => {
    const html = renderEmailAction(
      { ...MOCK_EMAIL_ACTION, variant: 'link' },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.brandPrimary);
    expect(html).not.toContain(MOCK_TENANT_EMAIL_BRAND.brandPrimarySolid);
  });

  it('escapes the label', () => {
    const html = renderEmailAction(
      { label: MOCK_SCRIPT_MARKUP, url: MOCK_URL },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).not.toContain(MOCK_SCRIPT_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_SCRIPT_MARKUP);
  });

  it('escapes the url', () => {
    const html = renderEmailAction(
      { ...MOCK_EMAIL_ACTION, url: `${MOCK_URL}/">${MOCK_SCRIPT_MARKUP}` },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).not.toContain(MOCK_SCRIPT_MARKUP);
  });

  it.each([
    [JAVASCRIPT_SCHEME, MOCK_JAVASCRIPT_URL],
    ['data:', MOCK_DATA_URL],
    [JAVASCRIPT_SCHEME, MOCK_TAB_SPLIT_JAVASCRIPT_URL],
  ])('neutralises a %s url given as %j to a harmless href', (scheme, url) => {
    const html = renderEmailAction(
      { ...MOCK_EMAIL_ACTION, url },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).not.toContain(scheme);
    expect(html).toContain('href="#"');
  });

  it.each([
    'http://example.com/sign-in',
    `${MOCK_URL}/sign-in?token=abc`,
    'mailto:someone@example.com',
  ])('lets the safe url %s through unchanged', (url) => {
    const html = renderEmailAction(
      { ...MOCK_EMAIL_ACTION, url },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).toContain(`href="${url}"`);
  });
});
