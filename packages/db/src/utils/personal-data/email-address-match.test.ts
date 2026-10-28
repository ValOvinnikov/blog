import { MOCK_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';

import { withExactEmailAddress } from './email-address-match';
import { encryptPersonalValue } from './personal-data';

const MOCK_TAGGED_EMAIL = taggedMixedCaseAddress(MOCK_INVITE_EMAIL);

function mockEncryptedRow(email: string): { emailEncrypted: string } {
  return { emailEncrypted: encryptPersonalValue(email) };
}

describe(withExactEmailAddress, () => {
  it('keeps only the rows stored under the requested address', () => {
    const exactRow = mockEncryptedRow(MOCK_INVITE_EMAIL);
    const siblingRow = mockEncryptedRow(MOCK_TAGGED_EMAIL);

    const matches = withExactEmailAddress(
      [siblingRow, exactRow],
      MOCK_INVITE_EMAIL,
    );

    expect(matches).toEqual([{ row: exactRow, address: MOCK_INVITE_EMAIL }]);
  });

  it('matches an address stored in another casing', () => {
    const storedAddress = MOCK_INVITE_EMAIL.toUpperCase();
    const row = mockEncryptedRow(storedAddress);

    expect(withExactEmailAddress([row], MOCK_INVITE_EMAIL)).toEqual([
      { row, address: storedAddress },
    ]);
  });
});
