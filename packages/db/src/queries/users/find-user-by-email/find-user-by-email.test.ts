import {
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_USER_EMAIL,
  insertTestReader,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import {
  usePersonalDataFallbackListener,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { findUserByEmail } from './find-user-by-email';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();
const fallbackListener = usePersonalDataFallbackListener();

const MOCK_TAGGED_USER_EMAIL = taggedMixedCaseAddress(MOCK_USER_EMAIL);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(findUserByEmail, () => {
  it('finds a backfilled user by any casing of the address', async () => {
    const user = await insertTestReader(db(), MOCK_USER_EMAIL);

    await expect(
      findUserByEmail(MOCK_USER_EMAIL.toUpperCase()),
    ).resolves.toEqual(user);
  });

  it('picks the user whose own address matches over a +tag sibling', async () => {
    await insertTestReader(db(), MOCK_TAGGED_USER_EMAIL);
    const user = await insertTestReader(db(), MOCK_USER_EMAIL);

    await expect(findUserByEmail(MOCK_USER_EMAIL)).resolves.toEqual(user);
  });

  it('never finds the account of an address for a +tag variant of it', async () => {
    await insertTestReader(db(), MOCK_USER_EMAIL);

    await expect(
      findUserByEmail(MOCK_TAGGED_USER_EMAIL),
    ).resolves.toBeUndefined();
  });

  it('finds a user not yet backfilled by the plain email', async () => {
    const user = await insertTestUser(db(), { email: MOCK_USER_EMAIL });

    await expect(findUserByEmail(MOCK_USER_EMAIL)).resolves.toEqual(user);
  });

  it('finds a user by the plain email when the index key is unset, and reports it', async () => {
    vi.stubEnv('PERSONAL_DATA_INDEX_KEY', undefined);
    const user = await insertTestReader(db(), MOCK_USER_EMAIL);

    await expect(findUserByEmail(MOCK_USER_EMAIL)).resolves.toEqual(user);
    expect(fallbackListener).toHaveBeenCalledExactlyOnceWith({
      owner: PERSONAL_DATA_OWNER.USER,
      reason: PERSONAL_DATA_FALLBACK_REASON.INDEX_KEY_UNSET,
    });
  });

  it('finds no user when no address matches', async () => {
    await expect(findUserByEmail(MOCK_USER_EMAIL)).resolves.toBeUndefined();
  });
});
