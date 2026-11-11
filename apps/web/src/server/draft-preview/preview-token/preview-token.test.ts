import { faker } from '@faker-js/faker';
import { env } from '@web/utils/env/env';

import {
  mintPreviewToken,
  readPreviewTokenClaims,
  type TPreviewTokenClaims,
} from './preview-token';

vi.mock('@web/utils/env/env');

faker.seed(7179);

const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_OTHER_SECRET = faker.string.alphanumeric(32);
const MOCK_NOW = 1_800_000_000_000;

const MOCK_CLAIMS: TPreviewTokenClaims = {
  tenantId: faker.string.uuid(),
  path: `/${faker.lorem.slug()}`,
  expiresAt: MOCK_NOW + 1,
};

const setSecret = (secret: string | undefined): void => {
  Object.assign(env, { PREVIEW_LINK_SECRET: secret });
};

const mintWith = (secret: string, claims = MOCK_CLAIMS): string => {
  setSecret(secret);
  const token = mintPreviewToken(claims);
  setSecret(MOCK_SECRET);
  return token;
};

beforeEach(() => {
  setSecret(MOCK_SECRET);
});

describe(readPreviewTokenClaims, () => {
  let token: string;

  beforeEach(() => {
    token = mintPreviewToken(MOCK_CLAIMS);
  });

  it('reads back the claims of a token minted with the same secret', () => {
    expect(readPreviewTokenClaims(token, MOCK_NOW)).toEqual(MOCK_CLAIMS);
  });

  it('rejects a token signed with another secret', () => {
    const otherToken = mintWith(MOCK_OTHER_SECRET);

    expect(readPreviewTokenClaims(otherToken, MOCK_NOW)).toBeUndefined();
  });

  it('rejects a token whose claims were changed after signing', () => {
    const [, signature] = mintPreviewToken(MOCK_CLAIMS).split('.');
    const [forgedPayload] = mintPreviewToken({
      ...MOCK_CLAIMS,
      tenantId: faker.string.uuid(),
    }).split('.');

    expect(
      readPreviewTokenClaims(`${forgedPayload}.${signature}`, MOCK_NOW),
    ).toBeUndefined();
  });

  it.each([
    ['at its expiry', MOCK_CLAIMS.expiresAt],
    ['after its expiry', MOCK_CLAIMS.expiresAt + 1],
  ])('rejects a token %s', (_label, now) => {
    expect(readPreviewTokenClaims(token, now)).toBeUndefined();
  });

  it.each([
    ['an empty string', ''],
    ['a payload with no signature', 'payload'],
    ['an extra segment', 'payload.signature.extra'],
  ])('rejects a malformed token (%s)', (_label, malformed) => {
    expect(readPreviewTokenClaims(malformed, MOCK_NOW)).toBeUndefined();
  });

  it('rejects every token when no secret is set', () => {
    setSecret(undefined);

    expect(readPreviewTokenClaims(token, MOCK_NOW)).toBeUndefined();
  });
});

describe(mintPreviewToken, () => {
  it('throws without a secret', () => {
    setSecret(undefined);

    expect(() => mintPreviewToken(MOCK_CLAIMS)).toThrow();
  });
});
