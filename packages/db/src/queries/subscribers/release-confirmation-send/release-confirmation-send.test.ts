import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { readTestSubscriber } from '@blog/db/testing/subscribers/fixtures';

import { releaseConfirmationSend } from './release-confirmation-send';

vi.mock('@blog/db/client');

const MOCK_CLAIMED_AT = new Date('2026-10-15T10:00:00.000Z');
const MOCK_NEWER_CLAIMED_AT = new Date('2026-10-15T10:20:00.000Z');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(releaseConfirmationSend, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  async function readSentAt(id: string) {
    const { confirmationSentAt } = await readTestSubscriber(db(), id);
    return confirmationSentAt;
  }

  it('clears the send time it claimed', async () => {
    const { id } = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
      { confirmationSentAt: MOCK_CLAIMED_AT },
    );

    await releaseConfirmationSend(id, MOCK_CLAIMED_AT);

    await expect(readSentAt(id)).resolves.toBeNull();
  });

  it('leaves a newer claim in place', async () => {
    const { id } = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
      { confirmationSentAt: MOCK_NEWER_CLAIMED_AT },
    );

    await releaseConfirmationSend(id, MOCK_CLAIMED_AT);

    await expect(readSentAt(id)).resolves.toEqual(MOCK_NEWER_CLAIMED_AT);
  });
});
