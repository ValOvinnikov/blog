import { resolveClientKey } from './client-key';

describe(resolveClientKey, () => {
  it('uses the first address in x-forwarded-for', () => {
    expect(
      resolveClientKey(
        new Headers({ 'x-forwarded-for': ' 203.0.113.5 , 10.0.0.1' }),
      ),
    ).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip', () => {
    expect(resolveClientKey(new Headers({ 'x-real-ip': '203.0.113.9' }))).toBe(
      '203.0.113.9',
    );
  });

  it('answers "unknown" when neither header is present', () => {
    expect(resolveClientKey(new Headers())).toBe('unknown');
  });
});
