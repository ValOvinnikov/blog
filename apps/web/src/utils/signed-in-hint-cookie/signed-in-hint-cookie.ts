export const SIGNED_IN_HINT_COOKIE_NAME = 'signed_in_hint';
export const SIGNED_IN_HINT_ATTRIBUTE = 'data-signed-in';

const SIGNED_IN_HINT_COOKIE_ATTRIBUTES = ['Path=/', 'SameSite=Lax', 'Secure'];

export const encodeSignedInHint = (sessionExpires: string): string =>
  [
    `${SIGNED_IN_HINT_COOKIE_NAME}=1`,
    `Expires=${new Date(sessionExpires).toUTCString()}`,
    ...SIGNED_IN_HINT_COOKIE_ATTRIBUTES,
  ].join('; ');

export const encodeClearedSignedInHint = (): string =>
  [
    `${SIGNED_IN_HINT_COOKIE_NAME}=`,
    'Max-Age=0',
    ...SIGNED_IN_HINT_COOKIE_ATTRIBUTES,
  ].join('; ');
