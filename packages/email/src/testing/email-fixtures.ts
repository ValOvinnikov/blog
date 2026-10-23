export const MOCK_PLATFORM_BRAND_NAME = 'Quillstack';
export const MOCK_SIGN_IN_URL = 'https://admin.example.com/sign-in';
export const MOCK_TENANT_NAME = 'Northwind';
export const MOCK_TENANT_ID = 'tenant_1';
export const MOCK_UNSAFE_MARKUP = '<img src=x onerror=alert(1)>';
export const MOCK_ESCAPED_UNSAFE_MARKUP = '&lt;img src=x onerror=alert(1)&gt;';
export const MOCK_UNSAFE_URL = 'javascript:void(0)';
export const MOCK_SCRIPT_MARKUP = '<script>alert(1)</script>';
export const MOCK_ESCAPED_SCRIPT_MARKUP =
  '&lt;script&gt;alert(1)&lt;/script&gt;';
export const MOCK_ATTRIBUTE_BREAKOUT = '"><img src=x onerror=alert(1)>';
export const MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT =
  '%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E';
export const MOCK_JAVASCRIPT_URL = 'javascript:alert(document.cookie)';
export const MOCK_TAB_SPLIT_JAVASCRIPT_URL =
  'java\tscript:alert(document.cookie)';
export const MOCK_DATA_URL = `data:text/html,${MOCK_SCRIPT_MARKUP}`;
export const MOCK_URL = 'https://example.com';
export const MOCK_LINK_HTML = `<a href="${MOCK_URL}">Confirm</a>`;
export const MOCK_BODY_HTML = '<p>Body</p>';
export const MOCK_LOGO_URL = 'https://cdn.example.com/logo.png';
export const MOCK_POSTAL_ADDRESS = '123 Main St, Springfield';
export const MOCK_EMAIL_SUBJECT = 'Your site is ready';
export const MOCK_EMAIL_ACTION = {
  label: 'Open your site',
  url: 'https://acme.example.com/welcome',
};
export const MOCK_EMAIL_ADDRESS = 'editor@example.com';
export const MOCK_INVALID_EMAIL_ADDRESS = 'not-an-email';
export const MOCK_RESEND_API_KEY = 'test-resend-key';
export const MOCK_MAGIC_LINK_URL =
  'https://example.com/api/auth/callback/email?token=abc';
export const MOCK_PLATFORM_MAGIC_LINK_URL =
  'https://platform.example.com/api/auth/callback/email?token=abc';
export const MOCK_ATTACKER_URL = 'https://attacker.example.com/phish';
