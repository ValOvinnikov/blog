import {
  encodeClearedSignedInHint,
  encodeSignedInHint,
} from './signed-in-hint-cookie';

describe(encodeSignedInHint, () => {
  it('expires the hint when the session expires', () => {
    expect(encodeSignedInHint('2099-01-01T00:00:00.000Z')).toBe(
      'signed_in_hint=1; Expires=Thu, 01 Jan 2099 00:00:00 GMT; Path=/; SameSite=Lax; Secure',
    );
  });
});

describe(encodeClearedSignedInHint, () => {
  it('expires the hint immediately on the same path', () => {
    expect(encodeClearedSignedInHint()).toBe(
      'signed_in_hint=; Max-Age=0; Path=/; SameSite=Lax; Secure',
    );
  });
});
