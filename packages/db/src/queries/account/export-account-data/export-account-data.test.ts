import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { exportAccountData } from './export-account-data';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const OLDER_POST_ID = 'post-older';
const NEWER_POST_ID = 'post-newer';
const OTHER_POST_ID = 'post-other';
const PROFILE = { name: 'Jane Doe', email: 'jane@example.com' };
const AVATAR_URL = 'https://example.com/avatar.png';

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();
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
    expect(await exportAccountData(tenantId, USER_ID)).toBeUndefined();
  });

  it("exports the decrypted profile and this tenant's bookmarks, newest first", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.users)
      .values([
        {
          id: USER_ID,
          ...PROFILE,
          ...userPersonalColumns(PROFILE),
          image: AVATAR_URL,
        },
        { id: OTHER_USER_ID },
      ]);
    await db()
      .insert(schema.bookmarks)
      .values([
        {
          tenantId,
          userId: USER_ID,
          postId: OLDER_POST_ID,
          createdAt: new Date(2026, 0, 1),
        },
        {
          tenantId,
          userId: USER_ID,
          postId: NEWER_POST_ID,
          createdAt: new Date(2026, 0, 2),
        },
        { tenantId, userId: OTHER_USER_ID, postId: OTHER_POST_ID },
        { tenantId: otherTenantId, userId: USER_ID, postId: OTHER_POST_ID },
      ]);

    const result = await exportAccountData(tenantId, USER_ID);

    expect(result).toEqual({
      profile: {
        id: USER_ID,
        ...PROFILE,
        emailVerified: undefined,
        image: AVATAR_URL,
      },
      bookmarks: [
        { postId: NEWER_POST_ID, createdAt: new Date(2026, 0, 2) },
        { postId: OLDER_POST_ID, createdAt: new Date(2026, 0, 1) },
      ],
    });
  });

  it('exports unset profile fields as undefined and no bookmarks', async () => {
    await db().insert(schema.users).values({ id: USER_ID });

    const result = await exportAccountData(tenantId, USER_ID);

    expect(result).toEqual({
      profile: {
        id: USER_ID,
        name: undefined,
        email: undefined,
        emailVerified: undefined,
        image: undefined,
      },
      bookmarks: [],
    });
  });
});
