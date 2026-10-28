import * as schema from '@blog/db/schema';
import { insertTestTenant, MOCK_OWNER_EMAIL } from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import {
  clearUnsentStudioReinvite,
  getUnsentStudioReinviteEmail,
  setUnsentStudioReinvite,
} from './unsent-studio-reinvite';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
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
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('reads back the former owner email it stored', async () => {
    await setUnsentStudioReinvite(tenantId, MOCK_OWNER_EMAIL);

    const email = await getUnsentStudioReinviteEmail(tenantId);

    expect(email).toBe(MOCK_OWNER_EMAIL);
  });

  it('never stores the address in readable form', async () => {
    await setUnsentStudioReinvite(tenantId, MOCK_OWNER_EMAIL);

    const stored = await readStoredValue(tenantId);

    expect(stored).not.toContain(MOCK_OWNER_EMAIL);
  });

  it('reads nothing once cleared', async () => {
    await setUnsentStudioReinvite(tenantId, MOCK_OWNER_EMAIL);

    await clearUnsentStudioReinvite(tenantId);

    expect(await getUnsentStudioReinviteEmail(tenantId)).toBeNull();
  });

  it('reads nothing for a tenant that never had one', async () => {
    expect(await getUnsentStudioReinviteEmail(tenantId)).toBeNull();
  });
});
