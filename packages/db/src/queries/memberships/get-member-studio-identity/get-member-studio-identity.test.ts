import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import {
  MOCK_EDITOR_EMAIL,
  insertTestMember,
} from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_SANITY_USER_ID } from '@shinefold/db/testing/sanity-management-client/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getMemberStudioIdentity } from './get-member-studio-identity';

vi.mock('@shinefold/db/client');

faker.seed(7607);

const db = useQueryTestDb();

const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getMemberStudioIdentity, () => {
  it.each([
    ['an unlocked member', { sanityUserId: MOCK_SANITY_USER_ID }],
    [
      'a locked member',
      { sanityUserId: MOCK_SANITY_USER_ID, lockedAt: MOCK_NOW },
    ],
    ['a member with no Sanity user yet', { sanityUserId: undefined }],
  ])(
    'returns the decrypted email and Sanity user id of %s',
    async (_description, overrides) => {
      const { id } = await insertTestMember(
        db(),
        tenant().id,
        MOCK_EDITOR_EMAIL,
        overrides,
      );

      await expect(getMemberStudioIdentity(tenant().id, id)).resolves.toEqual({
        email: MOCK_EDITOR_EMAIL,
        sanityUserId: overrides.sanityUserId,
      });
    },
  );

  it('finds no member of another tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const { id } = await insertTestMember(
      db(),
      otherTenantId,
      MOCK_EDITOR_EMAIL,
    );

    await expect(
      getMemberStudioIdentity(tenant().id, id),
    ).resolves.toBeUndefined();
  });

  it('finds no member for an id that is not a UUID', async () => {
    await expect(
      getMemberStudioIdentity(tenant().id, faker.lorem.word()),
    ).resolves.toBeUndefined();
  });
});
