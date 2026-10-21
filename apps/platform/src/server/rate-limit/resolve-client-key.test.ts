import { resolveClientKey } from './resolve-client-key';

const CLIENT_IP = '203.0.113.5';

describe('resolveClientKey', () => {
  it('uses the first x-forwarded-for address', () => {
    const headers = new Headers({
      'x-forwarded-for': `${CLIENT_IP}, 198.51.100.7`,
    });

    expect(resolveClientKey(headers)).toBe(CLIENT_IP);
  });

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': CLIENT_IP });

    expect(resolveClientKey(headers)).toBe(CLIENT_IP);
  });

  it('returns unknown when neither header is present', () => {
    expect(resolveClientKey(new Headers())).toBe('unknown');
  });
});
