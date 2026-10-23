import {
  MOCK_FROM_ADDRESS,
  MOCK_VERIFIED_DOMAIN_FROM_ADDRESS,
} from '@blog/auth/testing/magic-link-fixtures';

import { resolveMagicLinkFromAddress } from './resolve-magic-link-from-address';

describe(resolveMagicLinkFromAddress, () => {
  it('falls back to the Resend shared testing sender when unset', () => {
    expect(resolveMagicLinkFromAddress(undefined)).toBe(MOCK_FROM_ADDRESS);
  });

  it('uses the configured address when set', () => {
    expect(resolveMagicLinkFromAddress(MOCK_VERIFIED_DOMAIN_FROM_ADDRESS)).toBe(
      MOCK_VERIFIED_DOMAIN_FROM_ADDRESS,
    );
  });
});
