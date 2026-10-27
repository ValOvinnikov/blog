import type { TMaybeNull } from '@blog/config/types';
import {
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';
import { MOCK_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import {
  usePersonalDataFallbackListener,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';

import { withExactEmailAddress } from './email-address-match';
import { encryptPersonalValue } from './personal-data';
import type { TPersonalDataFallback } from './personal-data-fallback';

usePersonalDataKeys();
const fallbackListener = usePersonalDataFallbackListener();

const MOCK_TAGGED_EMAIL = taggedMixedCaseAddress(MOCK_INVITE_EMAIL);
const MOCK_NOT_BACKFILLED_FALLBACK: TPersonalDataFallback = {
  owner: PERSONAL_DATA_OWNER.INVITE,
  reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
};

type TMockEmailRow = { email: string; emailEncrypted: TMaybeNull<string> };

function mockEncryptedRow(email: string): TMockEmailRow {
  return { email, emailEncrypted: encryptPersonalValue(email) };
}

function mockPlainRow(email: string): TMockEmailRow {
  return { email, emailEncrypted: null };
}

describe(withExactEmailAddress, () => {
  it('keeps only the rows stored under the requested address', () => {
    const exactRow = mockEncryptedRow(MOCK_INVITE_EMAIL);
    const siblingRow = mockEncryptedRow(MOCK_TAGGED_EMAIL);

    const matches = withExactEmailAddress(
      [siblingRow, exactRow],
      MOCK_INVITE_EMAIL,
      PERSONAL_DATA_OWNER.INVITE,
    );

    expect(matches).toEqual([{ row: exactRow, address: MOCK_INVITE_EMAIL }]);
  });

  it('reports a plain read for each kept row not yet backfilled', () => {
    const rows = [
      mockPlainRow(MOCK_INVITE_EMAIL),
      mockEncryptedRow(MOCK_INVITE_EMAIL),
      mockPlainRow(` ${MOCK_INVITE_EMAIL.toUpperCase()} `),
    ];

    withExactEmailAddress(rows, MOCK_INVITE_EMAIL, PERSONAL_DATA_OWNER.INVITE);

    expect(fallbackListener.mock.calls).toEqual([
      [MOCK_NOT_BACKFILLED_FALLBACK],
      [MOCK_NOT_BACKFILLED_FALLBACK],
    ]);
  });

  it('reports nothing for a row it drops', () => {
    const matches = withExactEmailAddress(
      [mockPlainRow(MOCK_TAGGED_EMAIL)],
      MOCK_INVITE_EMAIL,
      PERSONAL_DATA_OWNER.INVITE,
    );

    expect(matches).toEqual([]);
    expect(fallbackListener).not.toHaveBeenCalled();
  });
});
