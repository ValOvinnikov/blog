import {
  encodeClearedSignedInHint,
  encodeSignedInHint,
  SIGNED_IN_HINT_COOKIE_NAME,
} from './signed-in-hint-cookie';

const MOCK_SESSION_EXPIRES = '2099-01-01T00:00:00.000Z';

describe(encodeSignedInHint, () => {
  it('expires the hint when the session expires', () => {
    expect(encodeSignedInHint(MOCK_SESSION_EXPIRES)).toBe(
      `${SIGNED_IN_HINT_COOKIE_NAME}=1; Expires=Thu, 01 Jan 2099 00:00:00 GMT; Path=/; SameSite=Lax; Secure`,
    );
  });
});

describe(encodeClearedSignedInHint, () => {
  it('expires the hint immediately on the same path', () => {
    expect(encodeClearedSignedInHint()).toBe(
      `${SIGNED_IN_HINT_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax; Secure`,
    );
  });
});
