import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import * as schema from '@blog/db/schema';
import { insertTestTenant, MOCK_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { findPendingInviteByEmail } from './find-pending-invite-by-email';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_TAGGED_INVITE_EMAIL = taggedMixedCaseAddress(MOCK_INVITE_EMAIL);

async function insertInvite(
  overrides: Partial<typeof schema.membershipInvites.$inferInsert> = {},
): Promise<string> {
  const { id: tenantId } = await insertTestTenant(db());
  await db()
    .insert(schema.membershipInvites)
    .values({
      tenantId,
      ...inviteEmailColumns(MOCK_INVITE_EMAIL),
      role: MEMBERSHIP_ROLE.OWNER,
      ...overrides,
    });
  return tenantId;
}

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

describe(findPendingInviteByEmail, () => {
  describe('with the personal data keys configured', () => {
    usePersonalDataKeys();

    it('returns every pending invite for the address across tenants, skipping consumed ones', async () => {
      const pendingTenantId = await insertInvite();
      const secondPendingTenantId = await insertInvite();
      await insertInvite({ consumedAt: new Date() });

      const invites = await findPendingInviteByEmail(
        MOCK_INVITE_EMAIL.toUpperCase(),
      );

      expect(invites.map(({ tenantId }) => tenantId).sort()).toEqual(
        [pendingTenantId, secondPendingTenantId].sort(),
      );
    });

    it('matches an address padded with whitespace', async () => {
      const tenantId = await insertInvite();

      const invites = await findPendingInviteByEmail(
        `  ${MOCK_INVITE_EMAIL}  `,
      );

      expect(invites.map((invite) => invite.tenantId)).toEqual([tenantId]);
    });

    it('finds an invite sent to a +tag address by that exact address', async () => {
      const tenantId = await insertInvite(
        inviteEmailColumns(MOCK_TAGGED_INVITE_EMAIL),
      );

      const invites = await findPendingInviteByEmail(MOCK_TAGGED_INVITE_EMAIL);

      expect(invites.map((invite) => invite.tenantId)).toEqual([tenantId]);
    });

    it.each([
      [
        'an address by a +tag variant of it',
        MOCK_INVITE_EMAIL,
        MOCK_TAGGED_INVITE_EMAIL,
      ],
      [
        'a +tag variant by the address',
        MOCK_TAGGED_INVITE_EMAIL,
        MOCK_INVITE_EMAIL,
      ],
    ])(
      'never matches an invite sent to %s',
      async (_label, sentTo, requested) => {
        await insertInvite(inviteEmailColumns(sentTo));

        await expect(findPendingInviteByEmail(requested)).resolves.toEqual([]);
      },
    );

    it('matches an invite not yet backfilled by its plain email', async () => {
      const tenantId = await insertInvite({
        emailEncrypted: null,
        emailIndex: null,
      });

      const invites = await findPendingInviteByEmail(MOCK_INVITE_EMAIL);

      expect(invites.map((invite) => invite.tenantId)).toEqual([tenantId]);
    });

    it('returns nothing for an address with no invite', async () => {
      await insertInvite();

      await expect(
        findPendingInviteByEmail(faker.internet.email()),
      ).resolves.toEqual([]);
    });
  });

  describe('while the index key is unset', () => {
    it.each([
      ['a re-cased address', MOCK_INVITE_EMAIL.toUpperCase()],
      ['a padded address', `  ${MOCK_INVITE_EMAIL}  `],
    ])('matches an invite by its plain email for %s', async (_label, email) => {
      const tenantId = await insertInvite();

      const invites = await findPendingInviteByEmail(email);

      expect(invites.map((invite) => invite.tenantId)).toEqual([tenantId]);
    });
  });
});
