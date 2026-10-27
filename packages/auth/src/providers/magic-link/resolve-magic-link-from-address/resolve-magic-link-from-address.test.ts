import { MOCK_FROM_ADDRESS } from '@blog/auth/testing/magic-link-fixtures';

import { resolveMagicLinkFromAddress } from './resolve-magic-link-from-address';

describe(resolveMagicLinkFromAddress, () => {
  it('uses the configured address when set', () => {
    expect(resolveMagicLinkFromAddress(MOCK_FROM_ADDRESS)).toBe(
      MOCK_FROM_ADDRESS,
    );
  });

  it('falls back to a named sender address when unset', () => {
    expect(resolveMagicLinkFromAddress(undefined)).toMatch(/^.+ <.+@.+>$/);
  });
});
