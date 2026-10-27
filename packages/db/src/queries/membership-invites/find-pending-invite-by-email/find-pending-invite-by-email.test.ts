import {
  MEMBERSHIP_ROLE,
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import * as schema from '@blog/db/schema';
import { insertTestTenant, MOCK_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import {
  usePersonalDataFallbackListener,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { findPendingInviteByEmail } from './find-pending-invite-by-email';

vi.mock('@blog/db/client');

faker.seed(5765);

const db = useQueryTestDb();
usePersonalDataKeys();
const fallbackListener = usePersonalDataFallbackListener();

const MOCK_TAGGED_INVITE_EMAIL = taggedMixedCaseAddress(MOCK_INVITE_EMAIL);
const MOCK_CONSUMED_AT = faker.date.past();

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
  it('returns every pending invite across tenants, skipping consumed ones', async () => {
    const pendingTenantId = await insertInvite();
    const secondPendingTenantId = await insertInvite();
    await insertInvite({ consumedAt: MOCK_CONSUMED_AT });

    const invites = await findPendingInviteByEmail(
      MOCK_INVITE_EMAIL.toUpperCase(),
    );

    expect(invites.map(({ tenantId }) => tenantId).sort()).toEqual(
      [pendingTenantId, secondPendingTenantId].sort(),
    );
  });

  it('matches an address padded with whitespace', async () => {
    const tenantId = await insertInvite();

    const invites = await findPendingInviteByEmail(`  ${MOCK_INVITE_EMAIL}  `);

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
      'a +tag variant of an invited address',
      MOCK_INVITE_EMAIL,
      MOCK_TAGGED_INVITE_EMAIL,
    ],
    [
      'the plain address of an invited +tag variant',
      MOCK_TAGGED_INVITE_EMAIL,
      MOCK_INVITE_EMAIL,
    ],
  ])('finds nothing for %s', async (_label, sentTo, requested) => {
    await insertInvite(inviteEmailColumns(sentTo));

    await expect(findPendingInviteByEmail(requested)).resolves.toEqual([]);
  });

  it('matches an invite not yet backfilled by its plain email, and reports it', async () => {
    const tenantId = await insertInvite({
      emailEncrypted: null,
      emailIndex: null,
    });

    const invites = await findPendingInviteByEmail(MOCK_INVITE_EMAIL);

    expect(invites.map((invite) => invite.tenantId)).toEqual([tenantId]);
    expect(fallbackListener).toHaveBeenCalledExactlyOnceWith({
      owner: PERSONAL_DATA_OWNER.INVITE,
      reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
    });
  });

  it('returns nothing for an address with no invite', async () => {
    await insertInvite();

    await expect(
      findPendingInviteByEmail(faker.internet.email()),
    ).resolves.toEqual([]);
  });

  describe('while the index key is unset', () => {
    beforeEach(() => {
      vi.stubEnv('PERSONAL_DATA_INDEX_KEY', undefined);
    });

    it.each([
      ['a re-cased address', MOCK_INVITE_EMAIL.toUpperCase()],
      ['a padded address', `  ${MOCK_INVITE_EMAIL}  `],
    ])(
      'matches an invite by its plain email for %s, and reports it',
      async (_label, email) => {
        const tenantId = await insertInvite();

        const invites = await findPendingInviteByEmail(email);

        expect(invites.map((invite) => invite.tenantId)).toEqual([tenantId]);
        expect(fallbackListener).toHaveBeenCalledExactlyOnceWith({
          owner: PERSONAL_DATA_OWNER.INVITE,
          reason: PERSONAL_DATA_FALLBACK_REASON.INDEX_KEY_UNSET,
        });
      },
    );
  });
});
