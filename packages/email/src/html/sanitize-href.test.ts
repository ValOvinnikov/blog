import { sanitizeHref } from './sanitize-href';

describe('sanitizeHref', () => {
  it('allows http, https and mailto urls through', () => {
    expect(sanitizeHref('http://example.com/x')).toBe('http://example.com/x');
    expect(sanitizeHref('https://example.com/x?y=1')).toBe(
      'https://example.com/x?y=1',
    );
    expect(sanitizeHref('mailto:someone@example.com')).toBe(
      'mailto:someone@example.com',
    );
  });

  it('rejects a javascript: url', () => {
    expect(sanitizeHref('javascript:alert(document.cookie)')).toBeNull();
  });

  it('rejects a javascript: url disguised with case', () => {
    expect(sanitizeHref('JavaScript:alert(document.cookie)')).toBeNull();
  });

  it('rejects a javascript: url with a tab hidden inside the scheme', () => {
    expect(sanitizeHref('java\tscript:alert(document.cookie)')).toBeNull();
  });

  it('rejects a javascript: url with a newline hidden inside the scheme', () => {
    expect(sanitizeHref('java\nscript:alert(document.cookie)')).toBeNull();
  });

  it('rejects a javascript: url with leading whitespace/control characters', () => {
    expect(sanitizeHref('   javascript:alert(document.cookie)')).toBeNull();
    expect(sanitizeHref(' javascript:alert(1)')).toBeNull();
  });

  it('rejects a data: url', () => {
    expect(sanitizeHref('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('rejects a vbscript: url', () => {
    expect(sanitizeHref('vbscript:msgbox(1)')).toBeNull();
  });

  it('rejects a scheme-relative url', () => {
    expect(sanitizeHref('//evil.example/x')).toBeNull();
  });

  it('rejects an unparseable value', () => {
    expect(sanitizeHref('not a url at all')).toBeNull();
    expect(sanitizeHref('')).toBeNull();
  });

  it('rejects a percent-encoded javascript scheme, since it never parses as one', () => {
    expect(sanitizeHref('javascript%3Aalert(1)')).toBeNull();
  });

  it('rejects an entity-encoded scheme, since it never parses as one', () => {
    expect(sanitizeHref('&#106;avascript:alert(1)')).toBeNull();
  });

  it('strips a mailto query string containing percent-encoded CR/LF header injection', () => {
    const result = sanitizeHref(
      'mailto:a@b.com?subject=x%0d%0aBcc:evil@example.com',
    );
    expect(result).toBe('mailto:a@b.com');
    expect(result).not.toMatch(/%0d%0a/i);
  });

  it('strips a benign mailto query string too', () => {
    expect(sanitizeHref('mailto:someone@example.com?subject=hello')).toBe(
      'mailto:someone@example.com',
    );
  });

  it('rejects an http url carrying userinfo', () => {
    expect(sanitizeHref('http://user@evil.example/')).toBeNull();
  });

  it('rejects an https url carrying userinfo with a password', () => {
    expect(sanitizeHref('https://user:pass@evil.example/')).toBeNull();
  });

  it('rejects an https url whose userinfo looks like a trusted domain', () => {
    expect(
      sanitizeHref('https://trusted-looking.example@evil.example/'),
    ).toBeNull();
  });
});
