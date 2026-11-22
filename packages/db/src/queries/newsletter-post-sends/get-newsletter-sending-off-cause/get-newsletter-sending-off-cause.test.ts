import {
  CAPABILITY,
  ERROR_CODE,
  NEWSLETTER_SKIP_REASON,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestEmailConfig } from '@shinefold/db/testing/email-config/fixtures';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { mockSettingsFeaturesToggles } from '@shinefold/db/testing/settings-features/fixtures';
import {
  insertTestEntitlementGrant,
  MOCK_GRANT_PAST,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import {
  patchTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import { getNewsletterSendingOffCause } from './get-newsletter-sending-off-cause';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { plan: TENANT_PLAN.GROWTH });
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.settingsFeatures);
  await db().delete(schema.emailConfig);
  await db().delete(schema.tenantEntitlementGrants);
});

async function insertFeatures(
  tenantId: string,
  newsletterEnabled: boolean,
): Promise<void> {
  await db()
    .insert(schema.settingsFeatures)
    .values({
      tenantId,
      ...mockSettingsFeaturesToggles({ newsletterEnabled }),
    });
}

describe(getNewsletterSendingOffCause, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('names no Newsletter in the plan before any other cause', async () => {
    await patchTestTenant(db(), tenantId, {
      plan: TENANT_PLAN.STARTER,
      status: TENANT_STATUS.SUSPENDED,
    });

    expect(await getNewsletterSendingOffCause(tenantId)).toEqual({
      ok: true,
      data: NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
    });
  });

  it('names an inactive site', async () => {
    await patchTestTenant(db(), tenantId, { status: TENANT_STATUS.SUSPENDED });

    expect(await getNewsletterSendingOffCause(tenantId)).toEqual({
      ok: true,
      data: NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
    });
  });

  it("reads Newsletter off from the preset's default when the site has no Features row", async () => {
    expect(await getNewsletterSendingOffCause(tenantId)).toEqual({
      ok: true,
      data: NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
    });
  });

  describe('with Newsletter on in Features', () => {
    beforeEach(async () => {
      await insertFeatures(tenantId, true);
    });

    it('names no cause for a site that sends posts', async () => {
      expect(await getNewsletterSendingOffCause(tenantId)).toEqual({
        ok: true,
        data: undefined,
      });
    });

    describe('on a plan without Newsletter', () => {
      beforeEach(async () => {
        await patchTestTenant(db(), tenantId, { plan: TENANT_PLAN.STARTER });
      });

      it('counts an open Newsletter grant as in the plan', async () => {
        await insertTestEntitlementGrant(db(), tenantId, {
          key: CAPABILITY.NEWSLETTER,
        });

        expect(await getNewsletterSendingOffCause(tenantId)).toEqual({
          ok: true,
          data: undefined,
        });
      });

      it.each([
        ['an expired', { expiresAt: MOCK_GRANT_PAST }],
        ['a revoked', { revokedAt: MOCK_GRANT_PAST }],
      ])('does not count %s Newsletter grant', async (_, closed) => {
        await insertTestEntitlementGrant(db(), tenantId, {
          key: CAPABILITY.NEWSLETTER,
          ...closed,
        });

        expect(await getNewsletterSendingOffCause(tenantId)).toEqual({
          ok: true,
          data: NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
        });
      });
    });

    it('names the sending setting off', async () => {
      await insertTestEmailConfig(db(), tenantId, { emailNewPosts: false });

      expect(await getNewsletterSendingOffCause(tenantId)).toEqual({
        ok: true,
        data: NEWSLETTER_SKIP_REASON.SENDING_OFF,
      });
    });
  });

  it('returns DB_NOT_FOUND for a tenant that does not exist', async () => {
    expect(await getNewsletterSendingOffCause(MOCK_MISSING_TENANT_ID)).toEqual({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
  });
});
