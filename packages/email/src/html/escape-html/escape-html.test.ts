import {
  MOCK_ESCAPED_SCRIPT_MARKUP,
  MOCK_SCRIPT_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { escapeHtml } from './escape-html';

describe(escapeHtml, () => {
  it.each([
    ['an ampersand', 'Tom & Jerry', 'Tom &amp; Jerry'],
    ['angle brackets', MOCK_SCRIPT_MARKUP, MOCK_ESCAPED_SCRIPT_MARKUP],
    [
      'double and single quotes',
      `"quoted" and 'single'`,
      '&quot;quoted&quot; and &#39;single&#39;',
    ],
    ['an existing entity, escaping it once more', '&lt;', '&amp;lt;'],
  ])('escapes %s', (_name, input, expected) => {
    expect(escapeHtml(input)).toBe(expected);
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Acme Corp')).toBe('Acme Corp');
  });
});
