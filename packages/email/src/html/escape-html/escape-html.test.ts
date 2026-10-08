import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('escapes double and single quotes', () => {
    expect(escapeHtml(`"quoted" and 'single'`)).toBe(
      '&quot;quoted&quot; and &#39;single&#39;',
    );
  });

  it('escapes ampersands before other entities so escaping is not double-applied', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Acme Corp')).toBe('Acme Corp');
  });
});
