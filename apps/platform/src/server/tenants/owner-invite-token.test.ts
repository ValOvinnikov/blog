import { faker } from '@faker-js/faker';
import {
  MOCK_INVITED_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
} from '@platform/testing/tenants/fixtures';

import {
  createOwnerInviteToken,
  verifyOwnerInviteToken,
} from './owner-invite-token';

vi.mock('@platform/utils/env/env');

faker.seed(5997);

const MOCK_GARBAGE_TOKEN = faker.string.alphanumeric(16);

describe(createOwnerInviteToken, () => {
  it('returns a stable, deterministic token for the same email', () => {
    const first = createOwnerInviteToken(MOCK_OWNER_EMAIL);
    const second = createOwnerInviteToken(MOCK_OWNER_EMAIL);

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns different tokens for different emails', () => {
    const ownerToken = createOwnerInviteToken(MOCK_OWNER_EMAIL);
    const otherToken = createOwnerInviteToken(MOCK_INVITED_OWNER_EMAIL);

    expect(ownerToken).not.toBe(otherToken);
  });
});

describe(verifyOwnerInviteToken, () => {
  it('accepts a token created for that exact email', () => {
    const token = createOwnerInviteToken(MOCK_OWNER_EMAIL);

    expect(verifyOwnerInviteToken(MOCK_OWNER_EMAIL, token)).toBe(true);
  });

  it('rejects a token created for a different email', () => {
    const tokenForOtherEmail = createOwnerInviteToken(MOCK_INVITED_OWNER_EMAIL);

    expect(verifyOwnerInviteToken(MOCK_OWNER_EMAIL, tokenForOtherEmail)).toBe(
      false,
    );
  });

  it.each([MOCK_GARBAGE_TOKEN, undefined])('rejects the token %s', (token) => {
    expect(verifyOwnerInviteToken(MOCK_OWNER_EMAIL, token)).toBe(false);
  });
});
