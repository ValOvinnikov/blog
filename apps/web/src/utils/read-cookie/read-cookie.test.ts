import { readCookie } from './read-cookie';

describe(readCookie, () => {
  it('returns the value of the named cookie among others', () => {
    expect(
      readCookie('theme=dark; consent=1.EXTERNAL_MEDIA; a=b', 'consent'),
    ).toBe('1.EXTERNAL_MEDIA');
  });

  it('returns an empty value for a cookie set without one', () => {
    expect(readCookie('consent=', 'consent')).toBe('');
  });

  it('returns nothing when the cookie is absent', () => {
    expect(readCookie('theme=dark', 'consent')).toBeUndefined();
  });

  it('returns nothing for an empty cookie string', () => {
    expect(readCookie('', 'consent')).toBeUndefined();
  });

  it('does not match a cookie whose name merely starts with the same prefix', () => {
    expect(readCookie('consent_other=1', 'consent')).toBeUndefined();
  });
});
