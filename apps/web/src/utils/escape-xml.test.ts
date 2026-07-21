import { describe, expect, it } from 'vitest';

import { escapeXml } from './escape-xml';

describe(escapeXml, () => {
  it('escapes ampersands', () => {
    expect(escapeXml('A & B')).toBe('A &amp; B');
  });

  it('escapes angle brackets', () => {
    expect(escapeXml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('escapes quotes', () => {
    expect(escapeXml(`"quoted" and 'single'`)).toBe(
      '&quot;quoted&quot; and &apos;single&apos;',
    );
  });

  it('leaves plain text untouched', () => {
    expect(escapeXml('A plain sentence.')).toBe('A plain sentence.');
  });

  it('escapes every reserved character in a single pass', () => {
    expect(escapeXml(`<a href="x">A & B's "C"</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;A &amp; B&apos;s &quot;C&quot;&lt;/a&gt;',
    );
  });
});
