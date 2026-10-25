import {
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  insertTestUser,
  MOCK_USER_EMAIL,
  MOCK_USER_NAME,
} from '@blog/db/testing/fixtures';
import {
  usePersonalDataFallbackListener,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { exportAccountData } from './export-account-data';

vi.mock('@blog/db/client');

const MOCK_UNKNOWN_USER_ID = faker.string.uuid();
const MOCK_OLDER_POST_ID = 'post-older';
const MOCK_NEWER_POST_ID = 'post-newer';
const MOCK_OTHER_POST_ID = 'post-other';
const MOCK_AVATAR_URL = 'https://example.com/avatar.png';

const db = useQueryTestDb();
usePersonalDataKeys();
const fallbackListener = usePersonalDataFallbackListener();
let tenantId: string;

beforeEach(async () => {
  ({ id: tenantId } = await insertTestTenant(db()));
});

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.users);
  await db().delete(schema.tenants);
});

describe(exportAccountData, () => {
  it('returns nothing for an unknown user', async () => {
    expect(
      await exportAccountData(tenantId, MOCK_UNKNOWN_USER_ID),
    ).toBeUndefined();
  });

  it("exports the decrypted profile and this tenant's bookmarks, newest first", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const { id: userId } = await insertTestUser(db(), {
      name: MOCK_USER_NAME,
      email: MOCK_USER_EMAIL,
      ...userPersonalColumns({ name: MOCK_USER_NAME, email: MOCK_USER_EMAIL }),
      image: MOCK_AVATAR_URL,
    });
    const { id: otherUserId } = await insertTestUser(db());
    await db()
      .insert(schema.bookmarks)
      .values([
        {
          tenantId,
          userId,
          postId: MOCK_OLDER_POST_ID,
          createdAt: new Date(2026, 0, 1),
        },
        {
          tenantId,
          userId,
          postId: MOCK_NEWER_POST_ID,
          createdAt: new Date(2026, 0, 2),
        },
        { tenantId, userId: otherUserId, postId: MOCK_OTHER_POST_ID },
        { tenantId: otherTenantId, userId, postId: MOCK_OTHER_POST_ID },
      ]);

    const result = await exportAccountData(tenantId, userId);

    expect(result).toEqual({
      profile: {
        id: userId,
        name: MOCK_USER_NAME,
        email: MOCK_USER_EMAIL,
        emailVerified: undefined,
        image: MOCK_AVATAR_URL,
      },
      bookmarks: [
        { postId: MOCK_NEWER_POST_ID, createdAt: new Date(2026, 0, 2) },
        { postId: MOCK_OLDER_POST_ID, createdAt: new Date(2026, 0, 1) },
      ],
    });
  });

  it('exports unset profile fields as undefined and no bookmarks', async () => {
    const { id: userId } = await insertTestUser(db());

    const result = await exportAccountData(tenantId, userId);

    expect(result).toEqual({
      profile: {
        id: userId,
        name: undefined,
        email: undefined,
        emailVerified: undefined,
        image: undefined,
      },
      bookmarks: [],
    });
  });

  it('exports the plain name and email of a user not yet backfilled, and reports it', async () => {
    const { id: userId } = await insertTestUser(db(), {
      name: MOCK_USER_NAME,
      email: MOCK_USER_EMAIL,
    });

    const result = await exportAccountData(tenantId, userId);

    expect(result).toEqual({
      profile: {
        id: userId,
        name: MOCK_USER_NAME,
        email: MOCK_USER_EMAIL,
        emailVerified: undefined,
        image: undefined,
      },
      bookmarks: [],
    });
    expect(fallbackListener).toHaveBeenCalledExactlyOnceWith({
      owner: PERSONAL_DATA_OWNER.USER,
      reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
    });
  });
});
