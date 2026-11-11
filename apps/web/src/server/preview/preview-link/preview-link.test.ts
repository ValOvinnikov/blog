import { faker } from '@faker-js/faker';
import { PREVIEW_LINK_REFUSAL } from '@web/constants/preview';
import { MOCK_PREVIEW_LINK_TTL_MS } from '@web/testing/server/preview/preview';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { signPreviewLinkToken, verifyPreviewLink } from './preview-link';

faker.seed(7180);

const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_OTHER_SECRET = faker.string.alphanumeric(32);
const MOCK_PATH = `/${faker.lorem.slug()}`;
const MOCK_NOW = faker.date.recent().getTime();

const signLink = (overrides: Partial<{ path: string; exp: number }> = {}) =>
  signPreviewLinkToken(
    {
      tenantId: MOCK_TENANT_ID,
      path: MOCK_PATH,
      exp: MOCK_NOW + MOCK_PREVIEW_LINK_TTL_MS,
      ...overrides,
    },
    MOCK_SECRET,
  );

const verify = (
  token: string | undefined,
  tenantId = MOCK_TENANT_ID,
  secret = MOCK_SECRET,
) => verifyPreviewLink({ token, secret, tenantId, now: MOCK_NOW });

describe(verifyPreviewLink, () => {
  it('accepts an unexpired link signed for this tenant', () => {
    expect(verify(signLink())).toEqual({ isValid: true, path: MOCK_PATH });
  });

  it('refuses an expired link', () => {
    expect(verify(signLink({ exp: MOCK_NOW }))).toEqual({
      isValid: false,
      refusal: PREVIEW_LINK_REFUSAL.EXPIRED,
    });
  });

  it("refuses another tenant's link", () => {
    expect(verify(signLink(), MOCK_OTHER_TENANT_ID)).toEqual({
      isValid: false,
      refusal: PREVIEW_LINK_REFUSAL.OTHER_TENANT,
    });
  });

  it('refuses a link to an absolute URL', () => {
    const token = signLink({ path: faker.internet.url() });

    expect(verify(token)).toEqual({
      isValid: false,
      refusal: PREVIEW_LINK_REFUSAL.OUTSIDE_SITE,
    });
  });

  it.each([
    { case: 'no token', token: undefined },
    { case: 'a token with no signature', token: signLink().split('.')[0] },
    { case: 'a tampered payload', token: `x${signLink()}` },
    { case: 'an unparseable token', token: faker.lorem.word() },
  ])('refuses $case', ({ token }) => {
    expect(verify(token)).toEqual({
      isValid: false,
      refusal: PREVIEW_LINK_REFUSAL.MALFORMED,
    });
  });

  it('refuses a link signed with another secret', () => {
    expect(verify(signLink(), MOCK_TENANT_ID, MOCK_OTHER_SECRET)).toEqual({
      isValid: false,
      refusal: PREVIEW_LINK_REFUSAL.MALFORMED,
    });
  });
});
