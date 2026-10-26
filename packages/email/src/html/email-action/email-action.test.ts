import {
  MOCK_DATA_URL,
  MOCK_ESCAPED_SCRIPT_MARKUP,
  MOCK_JAVASCRIPT_URL,
  MOCK_SCRIPT_MARKUP,
  MOCK_TAB_SPLIT_JAVASCRIPT_URL,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import { renderEmailAction } from './email-action';

const JAVASCRIPT_SCHEME = 'javascript:';
const SIGN_IN_URL = 'https://example.com/sign-in';

describe('renderEmailAction', () => {
  it('renders a button using the solid fill and contrast text colours', () => {
    const html = renderEmailAction(
      { label: 'Sign in', url: SIGN_IN_URL },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).toContain(`href="${SIGN_IN_URL}"`);
    expect(html).toContain('>Sign in</a>');
    expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.brandPrimarySolid);
    expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.brandPrimaryContrast);
  });

  it('uses a table for the button so it renders consistently across clients', () => {
    const html = renderEmailAction(
      { label: 'Accept invite', url: 'https://example.com/invite' },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).toContain('<table');
  });

  it('makes the link the whole content of the button cell', () => {
    const html = renderEmailAction(
      { label: 'Sign in', url: SIGN_IN_URL },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).toMatch(
      new RegExp(`<td[^>]*><a href="${SIGN_IN_URL}"[^>]*>Sign in</a></td>`),
    );
  });

  it('renders the link variant using brandPrimary rather than the solid fill', () => {
    const html = renderEmailAction(
      {
        label: 'Unsubscribe',
        url: 'https://example.com/unsubscribe',
        variant: 'link',
      },
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
      {
        label: 'Sign in',
        url: 'https://example.com/"><script>alert(1)</script>',
      },
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
      { label: 'Sign in', url },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).not.toContain(scheme);
    expect(html).toContain('href="#"');
  });

  it('allows an http/https/mailto url through unchanged', () => {
    const html = renderEmailAction(
      { label: 'Sign in', url: 'https://example.com/sign-in?token=abc' },
      MOCK_TENANT_EMAIL_BRAND,
    );

    expect(html).toContain('href="https://example.com/sign-in?token=abc"');
  });
});
