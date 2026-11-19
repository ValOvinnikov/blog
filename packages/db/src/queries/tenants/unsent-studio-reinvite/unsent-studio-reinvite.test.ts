import * as schema from '@shinefold/db/schema';
import { MOCK_OWNER_EMAIL } from '@shinefold/db/testing/fixtures';
import { usePersonalDataKeys } from '@shinefold/db/testing/personal-data';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { eq } from 'drizzle-orm';

import {
  clearUnsentStudioReinvite,
  getUnsentStudioReinviteEmail,
  setUnsentStudioReinvite,
} from './unsent-studio-reinvite';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
usePersonalDataKeys();

async function readStoredValue(tenantId: string) {
  const [row] = await db()
    .select({
      value: schema.tenants.unsentReinviteFormerOwnerEmailEncrypted,
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId));
  return row?.value;
}

describe('the unsent Studio re-invite', () => {
  describe('once stored', () => {
    beforeEach(async () => {
      await setUnsentStudioReinvite(tenant().id, MOCK_OWNER_EMAIL);
    });

    it('reads back the former owner email it stored', async () => {
      const email = await getUnsentStudioReinviteEmail(tenant().id);

      expect(email).toBe(MOCK_OWNER_EMAIL);
    });

    it('never stores the address in readable form', async () => {
      const stored = await readStoredValue(tenant().id);

      expect(stored).not.toContain(MOCK_OWNER_EMAIL);
    });

    it('reads nothing once cleared', async () => {
      await clearUnsentStudioReinvite(tenant().id);

      expect(await getUnsentStudioReinviteEmail(tenant().id)).toBeNull();
    });
  });

  it('reads nothing for a tenant that never had one', async () => {
    expect(await getUnsentStudioReinviteEmail(tenant().id)).toBeNull();
  });
});
