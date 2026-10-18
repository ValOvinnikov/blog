import { hasBearerSecret } from './has-bearer-secret';

const SECRET = 'a-very-secret-value';

const requestWith = (authorization?: string): Request =>
  new Request('https://admin.example.com/api/internal/any', {
    method: 'POST',
    headers: authorization ? { authorization } : {},
  });

describe('hasBearerSecret', () => {
  it('accepts the matching Bearer secret', () => {
    expect(hasBearerSecret(requestWith(`Bearer ${SECRET}`), SECRET)).toBe(true);
  });

  it('rejects a request with no Authorization header', () => {
    expect(hasBearerSecret(requestWith(), SECRET)).toBe(false);
  });

  it('rejects a different secret of the same length', () => {
    expect(
      hasBearerSecret(requestWith('Bearer a-very-secret-valuX'), SECRET),
    ).toBe(false);
  });

  it('rejects a secret of a different length', () => {
    expect(hasBearerSecret(requestWith('Bearer short'), SECRET)).toBe(false);
  });

  it('rejects the right secret under another scheme', () => {
    expect(hasBearerSecret(requestWith(`Basic ${SECRET}`), SECRET)).toBe(false);
  });
});
