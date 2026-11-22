import * as schema from '@shinefold/db/schema';
import {
  insertTestSubscriber,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { readTestSubscriber } from '@shinefold/db/testing/subscribers/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { releaseConfirmationSend } from './release-confirmation-send';

vi.mock('@shinefold/db/client');

const MOCK_CLAIMED_AT = new Date('2026-10-15T10:00:00.000Z');
const MOCK_NEWER_CLAIMED_AT = new Date('2026-10-15T10:20:00.000Z');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.subscribers);
});

describe(releaseConfirmationSend, () => {
  async function readSentAt(id: string) {
    const { confirmationSentAt } = await readTestSubscriber(db(), id);
    return confirmationSentAt;
  }

  it('clears the send time it claimed', async () => {
    const { id } = await insertTestSubscriber(
      db(),
      tenant().id,
      MOCK_SUBSCRIBER_EMAIL,
      { confirmationSentAt: MOCK_CLAIMED_AT },
    );

    await releaseConfirmationSend(id, MOCK_CLAIMED_AT);

    await expect(readSentAt(id)).resolves.toBeNull();
  });

  it('leaves a newer claim in place', async () => {
    const { id } = await insertTestSubscriber(
      db(),
      tenant().id,
      MOCK_SUBSCRIBER_EMAIL,
      { confirmationSentAt: MOCK_NEWER_CLAIMED_AT },
    );

    await releaseConfirmationSend(id, MOCK_CLAIMED_AT);

    await expect(readSentAt(id)).resolves.toEqual(MOCK_NEWER_CLAIMED_AT);
  });
});
