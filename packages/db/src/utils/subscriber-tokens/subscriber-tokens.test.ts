import { hashToken } from '@blog/utils/hash-token';

import { mintSubscriberTokens } from './subscriber-tokens';

describe(mintSubscriberTokens, () => {
  it('pairs each raw token with its hash', () => {
    const { tokens, hashes } = mintSubscriberTokens();

    expect(hashes).toEqual({
      confirmationTokenHash: hashToken(tokens.confirmationToken),
      unsubscribeTokenHash: hashToken(tokens.unsubscribeToken),
    });
  });

  it('mints distinct tokens on every call', () => {
    const first = mintSubscriberTokens();
    const second = mintSubscriberTokens();

    expect(second.tokens.confirmationToken).not.toBe(
      first.tokens.confirmationToken,
    );
    expect(second.tokens.unsubscribeToken).not.toBe(
      first.tokens.unsubscribeToken,
    );
  });
});
