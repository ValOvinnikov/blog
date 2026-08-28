import {
  createOwnerInviteToken,
  verifyOwnerInviteToken,
} from './owner-invite-token';

vi.mock('@platform/utils/env/env', () => ({
  env: { AUTH_SECRET: 'test-auth-secret' },
}));

describe(createOwnerInviteToken, () => {
  it('returns a stable, deterministic token for the same email', () => {
    const first = createOwnerInviteToken('owner@example.com');
    const second = createOwnerInviteToken('owner@example.com');

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns different tokens for different emails', () => {
    const ownerToken = createOwnerInviteToken('owner@example.com');
    const otherToken = createOwnerInviteToken('other@example.com');

    expect(ownerToken).not.toBe(otherToken);
  });
});

describe(verifyOwnerInviteToken, () => {
  it('returns true for a token created for that exact email', () => {
    const token = createOwnerInviteToken('owner@example.com');

    expect(verifyOwnerInviteToken('owner@example.com', token)).toBe(true);
  });

  it('returns false when the token was created for a different email', () => {
    const tokenForOtherEmail = createOwnerInviteToken('other@example.com');

    expect(
      verifyOwnerInviteToken('owner@example.com', tokenForOtherEmail),
    ).toBe(false);
  });

  it('returns false for an arbitrary/garbage token', () => {
    expect(
      verifyOwnerInviteToken('owner@example.com', 'not-a-real-token'),
    ).toBe(false);
  });

  it('returns false when the token is undefined', () => {
    expect(verifyOwnerInviteToken('owner@example.com', undefined)).toBe(false);
  });
});
