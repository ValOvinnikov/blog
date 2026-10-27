import {
  HTTP_METHOD,
  HTTP_STATUS,
  TENANT_DELETE_OUTCOME,
  TENANT_DELETE_SANITY_PROJECT_OUTCOME,
} from '@blog/config';
import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import { MEMBERSHIP_ROLE, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import {
  insertTestSubscriber,
  insertTestTenant,
  insertTestUser,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  emptyResponse,
  firstFetchCall,
  jsonResponse,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  MOCK_SANITY_EXPECTED_URL,
  MOCK_SANITY_ORGANIZATION_ID,
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_TOKEN,
} from '@blog/db/testing/sanity-management-client/fixtures';
import {
  MOCK_DEPROVISIONED_AT,
  MOCK_MISSING_TENANT_ID,
  MOCK_TENANT_DOMAIN,
} from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { deleteTenant } from './delete-tenant';

vi.mock('@blog/db/client');

faker.seed(6020);

const db = useQueryTestDb();

const MOCK_USER_ID = faker.string.uuid();
const MOCK_POST_ID = faker.string.uuid();
const MOCK_ACCENT_HUE = faker.number.int({ min: 0, max: 359 });
const MOCK_ERROR_BODY = faker.lorem.sentence();
const MOCK_BILLING_DENIED_BODY = {
  code: HTTP_STATUS.UNAUTHORIZED,
  status: faker.lorem.word(),
  message: `Cancellation of project "${MOCK_SANITY_PROJECT_ID}" requires billing permission on organization "${MOCK_SANITY_ORGANIZATION_ID}"`,
};

async function insertArchivedTenant(
  overrides: Parameters<typeof insertTestTenant>[1] = {},
): Promise<TTenant> {
  return insertTestTenant(db(), {
    status: TENANT_STATUS.ARCHIVED,
    deprovisionedAt: MOCK_DEPROVISIONED_AT,
    sanityProjectId: null,
    ...overrides,
  });
}

function selectTenantRows(tenantId: string) {
  return db().select().from(tenants).where(eq(tenants.id, tenantId));
}

afterEach(async () => {
  await db().delete(schema.siteConfig);
  await db().delete(schema.tenantDomains);
  await db().delete(schema.bookmarks);
  await db().delete(schema.subscribers);
  await db().delete(schema.memberships);
  await db().delete(schema.users);
  await db().delete(schema.tenants);
});

describe(deleteTenant, () => {
  describe('an archived tenant', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertArchivedTenant());
    });

    it('deletes an archived tenant row', async () => {
      const result = await deleteTenant(tenantId);

      const tenantRows = await selectTenantRows(tenantId);
      expect(result).toEqual({
        outcome: TENANT_DELETE_OUTCOME.DELETED,
        sanityProject: TENANT_DELETE_SANITY_PROJECT_OUTCOME.NO_PROJECT,
      });
      expect(tenantRows).toEqual([]);
    });

    describe('with a user', () => {
      beforeEach(async () => {
        await insertTestUser(db(), { id: MOCK_USER_ID });
      });

      it('cascades to the tenant membership and tenant_domains rows', async () => {
        await db().insert(schema.memberships).values({
          userId: MOCK_USER_ID,
          tenantId,
          role: MEMBERSHIP_ROLE.OWNER,
        });
        await db().insert(schema.tenantDomains).values({
          tenantId,
          domain: MOCK_TENANT_DOMAIN,
        });

        await deleteTenant(tenantId);

        const remainingMemberships = await db()
          .select()
          .from(schema.memberships)
          .where(eq(schema.memberships.tenantId, tenantId));
        const remainingDomains = await db()
          .select()
          .from(schema.tenantDomains)
          .where(eq(schema.tenantDomains.tenantId, tenantId));
        expect(remainingMemberships).toEqual([]);
        expect(remainingDomains).toEqual([]);
      });

      it('cascades to dependent subscriber and bookmark rows for that tenant', async () => {
        await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);
        await db().insert(schema.bookmarks).values({
          tenantId,
          userId: MOCK_USER_ID,
          postId: MOCK_POST_ID,
        });

        await deleteTenant(tenantId);

        const remainingSubscribers = await db()
          .select()
          .from(schema.subscribers)
          .where(eq(schema.subscribers.tenantId, tenantId));
        const remainingBookmarks = await db()
          .select()
          .from(schema.bookmarks)
          .where(eq(schema.bookmarks.tenantId, tenantId));
        expect(remainingSubscribers).toEqual([]);
        expect(remainingBookmarks).toEqual([]);
      });
    });

    it('cascades to a dependent site_config row for that tenant', async () => {
      await db().insert(schema.siteConfig).values({
        tenantId,
        preset: PRESET_ID.CONSOLE,
        accentHue: MOCK_ACCENT_HUE,
        headingFont: FONT_CHOICE.SPACE_GROTESK,
        bodyFont: FONT_CHOICE.NEWSREADER,
        radiusScale: RADIUS_SCALE.MD,
        density: DENSITY.DEFAULT,
      });

      await deleteTenant(tenantId);

      const remainingSiteConfig = await db()
        .select()
        .from(schema.siteConfig)
        .where(eq(schema.siteConfig.tenantId, tenantId));
      expect(remainingSiteConfig).toEqual([]);
    });
  });

  it('refuses to delete a tenant that is not archived, and the row survives', async () => {
    const tenant = await insertTestTenant(db());

    const result = await deleteTenant(tenant.id);

    const tenantRows = await selectTenantRows(tenant.id);
    expect(result).toEqual({ outcome: TENANT_DELETE_OUTCOME.NOT_ARCHIVED });
    expect(tenantRows).toEqual([tenant]);
  });

  it('returns not-found for a tenant id that does not exist', async () => {
    const result = await deleteTenant(MOCK_MISSING_TENANT_ID);

    expect(result).toEqual({ outcome: TENANT_DELETE_OUTCOME.NOT_FOUND });
  });

  describe('Sanity project deletion', () => {
    const fetchMock = useFetchFake();

    describe('a tenant with a Sanity project', () => {
      let tenant: TTenant;

      beforeEach(async () => {
        tenant = await insertArchivedTenant({
          sanityProjectId: MOCK_SANITY_PROJECT_ID,
        });
      });

      it('does not attempt Sanity deletion when no token is supplied', async () => {
        const result = await deleteTenant(tenant.id);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result).toEqual({
          outcome: TENANT_DELETE_OUTCOME.DELETED,
          sanityProject: TENANT_DELETE_SANITY_PROJECT_OUTCOME.SKIPPED_NO_TOKEN,
        });
      });

      it('deletes the Sanity project when a token is supplied and the API succeeds', async () => {
        fetchMock.mockResolvedValue(emptyResponse());

        const result = await deleteTenant(tenant.id, MOCK_SANITY_TOKEN);

        const { url, method } = firstFetchCall(fetchMock);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(url).toBe(MOCK_SANITY_EXPECTED_URL.project);
        expect(method).toBe(HTTP_METHOD.DELETE);
        expect(result).toEqual({
          outcome: TENANT_DELETE_OUTCOME.DELETED,
          sanityProject: TENANT_DELETE_SANITY_PROJECT_OUTCOME.DELETED,
        });
      });

      it('reports already-gone (not deleted) and still hard-deletes the row on a 404', async () => {
        fetchMock.mockResolvedValue(
          textResponse(MOCK_ERROR_BODY, HTTP_STATUS.NOT_FOUND),
        );

        const result = await deleteTenant(tenant.id, MOCK_SANITY_TOKEN);

        const tenantRows = await selectTenantRows(tenant.id);
        expect(result).toEqual({
          outcome: TENANT_DELETE_OUTCOME.DELETED,
          sanityProject: TENANT_DELETE_SANITY_PROJECT_OUTCOME.ALREADY_GONE,
        });
        expect(tenantRows).toEqual([]);
      });

      it('hard-deletes the row and reports left-archived on the org-billing 401', async () => {
        fetchMock.mockResolvedValue(
          jsonResponse(MOCK_BILLING_DENIED_BODY, HTTP_STATUS.UNAUTHORIZED),
        );

        const result = await deleteTenant(tenant.id, MOCK_SANITY_TOKEN);

        const tenantRows = await selectTenantRows(tenant.id);
        expect(result).toEqual({
          outcome: TENANT_DELETE_OUTCOME.DELETED,
          sanityProject: TENANT_DELETE_SANITY_PROJECT_OUTCOME.LEFT_ARCHIVED,
        });
        expect(tenantRows).toEqual([]);
      });

      it('throws on a non-billing Sanity failure and leaves the row untouched', async () => {
        fetchMock.mockResolvedValue(
          textResponse(MOCK_ERROR_BODY, HTTP_STATUS.FORBIDDEN),
        );

        await expect(
          deleteTenant(tenant.id, MOCK_SANITY_TOKEN),
        ).rejects.toThrow(new RegExp(`${HTTP_STATUS.FORBIDDEN}`));

        const tenantRows = await selectTenantRows(tenant.id);
        expect(tenantRows).toEqual([tenant]);
      });
    });

    it('reports no-project when the tenant never had one, even with a token', async () => {
      const { id } = await insertArchivedTenant();

      const result = await deleteTenant(id, MOCK_SANITY_TOKEN);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        outcome: TENANT_DELETE_OUTCOME.DELETED,
        sanityProject: TENANT_DELETE_SANITY_PROJECT_OUTCOME.NO_PROJECT,
      });
    });
  });
});
