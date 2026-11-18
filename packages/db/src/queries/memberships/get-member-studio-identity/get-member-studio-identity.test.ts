import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { insertTestMember } from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_SANITY_USER_ID } from '@shinefold/db/testing/sanity-management-client/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getMemberStudioIdentity } from './get-member-studio-identity';

vi.mock('@shinefold/db/client');

faker.seed(7607);

const db = useQueryTestDb();

const MOCK_EDITOR_EMAIL = faker.internet.email().toLowerCase();

const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getMemberStudioIdentity, () => {
  it.each([
    ['an unlocked member', {}],
    ['a locked member', { lockedAt: MOCK_NOW }],
  ])(
    'returns the decrypted email and Sanity user id of %s',
    async (_description, overrides) => {
      const { id } = await insertTestMember(
        db(),
        tenant().id,
        MOCK_EDITOR_EMAIL,
        { sanityUserId: MOCK_SANITY_USER_ID, ...overrides },
      );

      await expect(getMemberStudioIdentity(tenant().id, id)).resolves.toEqual({
        email: MOCK_EDITOR_EMAIL,
        sanityUserId: MOCK_SANITY_USER_ID,
      });
    },
  );

  it('reads a member with no Sanity user yet as no Sanity user id', async () => {
    const { id } = await insertTestMember(db(), tenant().id, MOCK_EDITOR_EMAIL);

    const identity = await getMemberStudioIdentity(tenant().id, id);

    expect(identity?.sanityUserId).toBeUndefined();
  });

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
