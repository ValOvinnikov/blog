import { faker } from '@faker-js/faker';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import { createAdminInvite } from '@shinefold/db/queries/admin-invites/create-admin-invite';
import * as schema from '@shinefold/db/schema';
import {
  adminInviteOf,
  useAdminInviter,
} from '@shinefold/db/testing/admin-invites/fixtures';
import { MOCK_INVITE_EMAIL } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { cancelAdminInvite } from './cancel-admin-invite';

vi.mock('@shinefold/db/client');

faker.seed(7866);

const MOCK_UNKNOWN_INVITE_ID = faker.string.uuid();
const MOCK_NON_UUID_INVITE_ID = faker.lorem.word();

const db = useQueryTestDb();

const inviterId = useAdminInviter(db);

describe(cancelAdminInvite, () => {
  it('removes a pending invite', async () => {
    const { id } = adminInviteOf(
      await createAdminInvite(MOCK_INVITE_EMAIL, ADMIN_ROLE.ADMIN, inviterId()),
    );

    await expect(cancelAdminInvite(id)).resolves.toBe(true);

    const rows = await db().select().from(schema.adminInvites);
    expect(rows).toHaveLength(0);
  });

  it.each([
    ['an invite that does not exist', MOCK_UNKNOWN_INVITE_ID],
    ['an id that is not a uuid', MOCK_NON_UUID_INVITE_ID],
  ])('reports false for %s', async (_case, inviteId) => {
    await expect(cancelAdminInvite(inviteId)).resolves.toBe(false);
  });
});
