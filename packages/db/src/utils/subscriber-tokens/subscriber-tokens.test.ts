import { sha256Hex } from '@blog/utils/hash';

import { mintConfirmationToken } from './subscriber-tokens';

describe(mintConfirmationToken, () => {
  it('pairs the raw token with its hash', () => {
    const { confirmationToken, confirmationTokenHash } =
      mintConfirmationToken();

    expect(confirmationTokenHash).toBe(sha256Hex(confirmationToken));
  });

  it('mints a distinct token on every call', () => {
    expect(mintConfirmationToken().confirmationToken).not.toBe(
      mintConfirmationToken().confirmationToken,
    );
  });
});
