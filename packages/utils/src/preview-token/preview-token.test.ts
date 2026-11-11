import { faker } from '@faker-js/faker';

import {
  type IPreviewTokenClaims,
  PREVIEW_TOKEN_CLOCK_SKEW_MS,
  PREVIEW_TOKEN_MAX_AGE_MS,
  readPreviewTokenClaims,
  signPreviewToken,
} from './preview-token';

faker.seed(7179);

const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_OTHER_SECRET = faker.string.alphanumeric(32);
const MOCK_NOW = 1_800_000_000_000;

const MOCK_CLAIMS: IPreviewTokenClaims = {
  tenantId: faker.string.uuid(),
  path: `/${faker.lorem.slug()}`,
  expiresAt: MOCK_NOW + 1,
};

const readAt = (token: string, now = MOCK_NOW) =>
  readPreviewTokenClaims(token, MOCK_SECRET, now);

const expiringIn = (remainingMs: number): string =>
  signPreviewToken(
    { ...MOCK_CLAIMS, expiresAt: MOCK_NOW + remainingMs },
    MOCK_SECRET,
  );

describe(readPreviewTokenClaims, () => {
  let token: string;

  beforeEach(() => {
    token = signPreviewToken(MOCK_CLAIMS, MOCK_SECRET);
  });

  it('reads back the claims of a token signed with the same secret', () => {
    expect(readAt(token)).toEqual(MOCK_CLAIMS);
  });

  it('rejects a token signed with another secret', () => {
    expect(
      readAt(signPreviewToken(MOCK_CLAIMS, MOCK_OTHER_SECRET)),
    ).toBeUndefined();
  });

  it('rejects a token whose claims were changed after signing', () => {
    const [, signature] = token.split('.');
    const [forgedPayload] = signPreviewToken(
      { ...MOCK_CLAIMS, tenantId: faker.string.uuid() },
      MOCK_SECRET,
    ).split('.');

    expect(readAt(`${forgedPayload}.${signature}`)).toBeUndefined();
  });

  it.each([
    ['at its expiry', MOCK_CLAIMS.expiresAt],
    ['after its expiry', MOCK_CLAIMS.expiresAt + 1],
  ])('rejects a token %s', (_label, now) => {
    expect(readAt(token, now)).toBeUndefined();
  });

  it('accepts a token expiring at the maximum lifetime plus clock skew', () => {
    const longest = expiringIn(
      PREVIEW_TOKEN_MAX_AGE_MS + PREVIEW_TOKEN_CLOCK_SKEW_MS,
    );

    expect(readAt(longest)).toBeDefined();
  });

  it('rejects a token expiring beyond the maximum lifetime', () => {
    const tooLong = expiringIn(
      PREVIEW_TOKEN_MAX_AGE_MS + PREVIEW_TOKEN_CLOCK_SKEW_MS + 1,
    );

    expect(readAt(tooLong)).toBeUndefined();
  });

  it.each([
    ['an empty string', ''],
    ['a payload with no signature', 'payload'],
    ['an extra segment', 'payload.signature.extra'],
  ])('rejects a malformed token (%s)', (_label, malformed) => {
    expect(readAt(malformed)).toBeUndefined();
  });
});
