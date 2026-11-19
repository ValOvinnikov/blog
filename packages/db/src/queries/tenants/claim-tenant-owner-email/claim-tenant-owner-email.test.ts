import { faker } from '@faker-js/faker';
import { TENANT_OWNER_EMAIL } from '@shinefold/db/constants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import {
  readTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';
import { isNull } from '@shinefold/utils/primitives';

import { claimTenantOwnerEmail } from './claim-tenant-owner-email';

vi.mock('@shinefold/db/client');

faker.seed(6020);

const db = useQueryTestDb();
useFrozenClock();
const tenant = useTestTenant(db);

const MOCK_HEADS_UP_SENT_AT = faker.date.past({ refDate: MOCK_NOW });
const MOCK_LATER = faker.date.soon({ refDate: MOCK_NOW });

describe(claimTenantOwnerEmail, () => {
  it('claims an email that has never been sent and records when', async () => {
    const claimedAt = await claimTenantOwnerEmail(
      tenant().id,
      TENANT_OWNER_EMAIL.INVITE_NUDGE,
    );

    const { ownerInviteNudgeSentAt } = await readTestTenant(db(), tenant().id);
    expect(claimedAt).toEqual(MOCK_NOW);
    expect(ownerInviteNudgeSentAt).toEqual(MOCK_NOW);
  });

  it('refuses a second claim and keeps the first send time', async () => {
    await claimTenantOwnerEmail(tenant().id, TENANT_OWNER_EMAIL.SITE_READY);
    vi.setSystemTime(MOCK_LATER);

    const secondClaim = await claimTenantOwnerEmail(
      tenant().id,
      TENANT_OWNER_EMAIL.SITE_READY,
    );

    const { ownerSiteReadySentAt } = await readTestTenant(db(), tenant().id);
    expect(secondClaim).toBeNull();
    expect(ownerSiteReadySentAt).toEqual(MOCK_NOW);
  });

  it('claims each email independently of the others', async () => {
    const { id } = await insertTestTenant(db(), {
      ownerInviteHeadsUpSentAt: MOCK_HEADS_UP_SENT_AT,
    });

    const claimedAt = await claimTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.INVITE_NUDGE,
    );

    expect(claimedAt).toEqual(MOCK_NOW);
  });

  it('lets exactly one of two concurrent claims through', async () => {
    const results = await Promise.all([
      claimTenantOwnerEmail(tenant().id, TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
      claimTenantOwnerEmail(tenant().id, TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
    ]);

    expect(results.filter((result) => !isNull(result))).toEqual([MOCK_NOW]);
  });

  it('claims nothing for a tenant id that does not exist', async () => {
    const claimedAt = await claimTenantOwnerEmail(
      MOCK_MISSING_TENANT_ID,
      TENANT_OWNER_EMAIL.SITE_READY,
    );

    expect(claimedAt).toBeNull();
  });
});
