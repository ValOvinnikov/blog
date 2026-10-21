import { sha256Hex } from '@blog/utils/hash';

import { mintSubscriberTokens } from './subscriber-tokens';

describe(mintSubscriberTokens, () => {
  it('pairs each raw token with its hash', () => {
    const { tokens, hashes } = mintSubscriberTokens();

    expect(hashes).toEqual({
      confirmationTokenHash: sha256Hex(tokens.confirmationToken),
      unsubscribeTokenHash: sha256Hex(tokens.unsubscribeToken),
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
