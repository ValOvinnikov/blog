import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  SITE_TYPE,
} from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { insertAuditEvent } from '@blog/db/queries/audit-events/insert-audit-event';
import type { getTenantByDomain } from '@blog/db/queries/tenant-domains/get-tenant-by-domain';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data';
import * as schema from '@blog/db/schema';
import { MOCK_NOT_AN_ADDRESS } from '@blog/db/testing/blocked-signup-identities/fixtures';
import { insertTestUser } from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_SELF_SERVE_DOMAIN as DOMAIN,
  MOCK_SELF_SERVE_MISSING_USER_ID,
  MOCK_SELF_SERVE_NAME as NAME,
  MOCK_SELF_SERVE_OTHER_DOMAIN as OTHER_DOMAIN,
  MOCK_SELF_SERVE_OTHER_EMAIL as OTHER_EMAIL,
  MOCK_SELF_SERVE_OTHER_USER_ID as OTHER_ID,
  MOCK_SELF_SERVE_OWNER_EMAIL as OWNER_EMAIL,
  MOCK_SELF_SERVE_OWNER_ID as OWNER_ID,
  MOCK_SELF_SERVE_OWNER_SHOUTED_EMAIL,
  MOCK_SELF_SERVE_OWNER_TAGGED_EMAIL,
  MOCK_SELF_SERVE_PADDED_DOMAIN,
  MOCK_SELF_SERVE_SCHEME_DOMAIN,
} from '@blog/db/testing/tenants/self-serve-fixtures';
import { errorResult, okResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

import type { ownsFreeTenant } from '../owns-free-tenant';

import {
  createSelfServeTenant,
  type TCreateSelfServeTenantInput,
} from './create-self-serve-tenant';

const {
  getDbMock,
  ownsFreeTenantMock,
  getTenantByDomainMock,
  insertAuditEventMock,
  OWNS_FREE_TENANT_MODULE,
  GET_TENANT_BY_DOMAIN_MODULE,
  INSERT_AUDIT_EVENT_MODULE,
} = vi.hoisted(() => ({
  getDbMock: vi.fn(),
  ownsFreeTenantMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  OWNS_FREE_TENANT_MODULE: '@blog/db/queries/tenants/owns-free-tenant',
  GET_TENANT_BY_DOMAIN_MODULE:
    '@blog/db/queries/tenant-domains/get-tenant-by-domain',
  INSERT_AUDIT_EVENT_MODULE: '@blog/db/queries/audit-events/insert-audit-event',
}));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

vi.mock(OWNS_FREE_TENANT_MODULE, () => ({
  ownsFreeTenant: ownsFreeTenantMock,
}));

vi.mock(GET_TENANT_BY_DOMAIN_MODULE, () => ({
  getTenantByDomain: getTenantByDomainMock,
}));

vi.mock(INSERT_AUDIT_EVENT_MODULE, () => ({
  insertAuditEvent: insertAuditEventMock,
}));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const ACCENT_HUE = 123;
const EXPECTED_OK = 'expected ok:true';

const input: TCreateSelfServeTenantInput = {
  name: NAME,
  domain: DOMAIN,
  locale: LOCALE_ISO_CODES.EN,
  siteType: SITE_TYPE.PORTFOLIO,
  preset: PRESET_ID.EDITORIAL,
  accentHue: ACCENT_HUE,
  owner: { userId: OWNER_ID, email: OWNER_EMAIL },
};

async function insertUser(id: string, email: string): Promise<void> {
  await insertTestUser(db(), {
    id,
    email,
    ...userPersonalColumns({ email }),
  });
}

function submitAs(userId: string, email: string, domain: string) {
  return createSelfServeTenant({ ...input, domain, owner: { userId, email } });
}

async function expectOnlyFirstSiteStored(): Promise<void> {
  expect(await db().select().from(schema.tenants)).toHaveLength(1);
  expect(await db().select().from(schema.memberships)).toHaveLength(1);
  expect(await db().select().from(schema.tenantDomains)).toHaveLength(1);
  expect(await db().select().from(schema.siteConfig)).toHaveLength(1);
  expect(await db().select().from(schema.auditEvents)).toHaveLength(1);
}

afterEach(async () => {
  await db().delete(schema.auditEvents);
  await db().delete(schema.memberships);
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(createSelfServeTenant, () => {
  beforeEach(async () => {
    const actual = await vi.importActual<{
      ownsFreeTenant: typeof ownsFreeTenant;
    }>(OWNS_FREE_TENANT_MODULE);
    ownsFreeTenantMock.mockImplementation(actual.ownsFreeTenant);
    const actualDomains = await vi.importActual<{
      getTenantByDomain: typeof getTenantByDomain;
    }>(GET_TENANT_BY_DOMAIN_MODULE);
    getTenantByDomainMock.mockImplementation(actualDomains.getTenantByDomain);
    const actualAudit = await vi.importActual<{
      insertAuditEvent: typeof insertAuditEvent;
    }>(INSERT_AUDIT_EVENT_MODULE);
    insertAuditEventMock.mockImplementation(actualAudit.insertAuditEvent);
    await insertUser(OWNER_ID, OWNER_EMAIL);
  });

  describe('for a person with no Free tenant', () => {
    it('inserts a PENDING Free tenant carrying the site type and no template version yet', async () => {
      const result = await createSelfServeTenant(input);

      if (!result.ok) throw new Error(EXPECTED_OK);
      expect(result.data).toMatchObject({
        name: NAME,
        primaryDomain: DOMAIN,
        locale: LOCALE_ISO_CODES.EN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        siteType: SITE_TYPE.PORTFOLIO,
        siteTemplateVersion: null,
        sanityProjectId: null,
      });
    });

    it('makes the signed-in user the OWNER and maps the domain to the tenant', async () => {
      const result = await createSelfServeTenant(input);

      if (!result.ok) throw new Error(EXPECTED_OK);
      const [membership] = await db()
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.tenantId, result.data.id));
      const [domainRow] = await db()
        .select()
        .from(schema.tenantDomains)
        .where(eq(schema.tenantDomains.tenantId, result.data.id));

      expect(membership).toMatchObject({
        userId: OWNER_ID,
        role: MEMBERSHIP_ROLE.OWNER,
      });
      expect(domainRow?.domain).toBe(DOMAIN);
    });

    it('stores the chosen preset and accent hue in site_config', async () => {
      const result = await createSelfServeTenant(input);

      if (!result.ok) throw new Error(EXPECTED_OK);
      const [config] = await db()
        .select()
        .from(schema.siteConfig)
        .where(eq(schema.siteConfig.tenantId, result.data.id));

      expect(config).toMatchObject({
        preset: PRESET_ID.EDITORIAL,
        accentHue: ACCENT_HUE,
      });
    });

    it('creates the settings_features row', async () => {
      const result = await createSelfServeTenant(input);

      if (!result.ok) throw new Error(EXPECTED_OK);
      const rows = await db()
        .select()
        .from(schema.settingsFeatures)
        .where(eq(schema.settingsFeatures.tenantId, result.data.id));

      expect(rows).toHaveLength(1);
    });

    it('records a CREATED audit event on the tenant, acted by the owner', async () => {
      const result = await createSelfServeTenant(input);

      if (!result.ok) throw new Error(EXPECTED_OK);
      const [event] = await db().select().from(schema.auditEvents);

      expect(event).toMatchObject({
        actorId: OWNER_ID,
        actorEmail: OWNER_EMAIL,
        action: AUDIT_ACTION.CREATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: result.data.id,
      });
    });
  });

  describe('the owner and the one-Free-tenant guard', () => {
    it('records the normalised owner address index on the tenant', async () => {
      const result = await createSelfServeTenant({
        ...input,
        owner: { userId: OWNER_ID, email: MOCK_SELF_SERVE_OWNER_SHOUTED_EMAIL },
      });

      if (!result.ok) throw new Error(EXPECTED_OK);
      expect(result.data.selfServeOwnerEmailIndex).toBe(
        testPersonalEmailIndex(OWNER_EMAIL),
      );
    });

    it('frees the slot once the person Free tenant is archived', async () => {
      const first = await createSelfServeTenant(input);
      if (!first.ok) throw new Error(EXPECTED_OK);
      await db()
        .update(schema.tenants)
        .set({ status: TENANT_STATUS.ARCHIVED })
        .where(eq(schema.tenants.id, first.data.id));

      const second = await createSelfServeTenant({
        ...input,
        domain: OTHER_DOMAIN,
      });

      expect(second.ok).toBe(true);
    });
  });

  describe('when a second person submits after the first created a site', () => {
    beforeEach(async () => {
      await insertUser(OTHER_ID, OTHER_EMAIL);
      await createSelfServeTenant(input);
    });

    it.each([
      ['seen by the pre-check', false],
      ['taken by a racing submit', true],
    ])('refuses a domain %s and leaves nothing behind', async (_, racing) => {
      if (racing) getTenantByDomainMock.mockResolvedValue(undefined);

      const result = await submitAs(OTHER_ID, OTHER_EMAIL, DOMAIN);

      expect(result).toEqual(errorResult(ERROR_CODE.DB_DUPLICATE_DOMAIN));
      await expectOnlyFirstSiteStored();
    });

    it('refuses the same address through the database index when the pre-check races', async () => {
      ownsFreeTenantMock.mockResolvedValue(okResult(false));

      const result = await submitAs(
        OTHER_ID,
        MOCK_SELF_SERVE_OWNER_TAGGED_EMAIL,
        OTHER_DOMAIN,
      );

      expect(result).toEqual(errorResult(ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT));
      await expectOnlyFirstSiteStored();
    });
  });

  describe('refusals', () => {
    it.each([
      ['the same address', OWNER_EMAIL],
      ['a +tag variant of it', MOCK_SELF_SERVE_OWNER_TAGGED_EMAIL],
      ['a differently cased variant', MOCK_SELF_SERVE_OWNER_SHOUTED_EMAIL],
    ])(
      'refuses a second Free tenant for %s and writes nothing',
      async (_, email) => {
        await createSelfServeTenant(input);

        const result = await submitAs(OWNER_ID, email, OTHER_DOMAIN);

        expect(result).toEqual(errorResult(ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT));
        expect(await db().select().from(schema.tenants)).toHaveLength(1);
        expect(await db().select().from(schema.auditEvents)).toHaveLength(1);
      },
    );

    it.each([
      ['a scheme-prefixed value', MOCK_SELF_SERVE_SCHEME_DOMAIN],
      ['a whitespace-padded value', MOCK_SELF_SERVE_PADDED_DOMAIN],
    ])('refuses %s as the domain and writes nothing', async (_, domain) => {
      const result = await createSelfServeTenant({ ...input, domain });

      expect(result).toEqual(errorResult(ERROR_CODE.DB_INVALID_DOMAIN));
      expect(await db().select().from(schema.tenants)).toHaveLength(0);
    });

    it('refuses an owner email that is not an address and writes nothing', async () => {
      const result = await createSelfServeTenant({
        ...input,
        owner: { userId: OWNER_ID, email: MOCK_NOT_AN_ADDRESS },
      });

      expect(result).toEqual(errorResult(ERROR_CODE.DB_INVALID_EMAIL));
      expect(await db().select().from(schema.tenants)).toHaveLength(0);
    });
  });

  it('rolls back the tenant and every row it wrote when the audit event fails', async () => {
    const auditFailure = new Error(NAME);
    insertAuditEventMock.mockRejectedValue(auditFailure);

    await expect(createSelfServeTenant(input)).rejects.toBe(auditFailure);

    expect(await db().select().from(schema.tenants)).toHaveLength(0);
    expect(await db().select().from(schema.memberships)).toHaveLength(0);
    expect(await db().select().from(schema.tenantDomains)).toHaveLength(0);
    expect(await db().select().from(schema.siteConfig)).toHaveLength(0);
    expect(await db().select().from(schema.settingsFeatures)).toHaveLength(0);
  });

  it('rolls back every row when the owner user does not exist', async () => {
    await expect(
      createSelfServeTenant({
        ...input,
        owner: { userId: MOCK_SELF_SERVE_MISSING_USER_ID, email: OTHER_EMAIL },
      }),
    ).rejects.toThrow();

    expect(await db().select().from(schema.tenants)).toHaveLength(0);
    expect(await db().select().from(schema.siteConfig)).toHaveLength(0);
    expect(await db().select().from(schema.settingsFeatures)).toHaveLength(0);
    expect(await db().select().from(schema.tenantDomains)).toHaveLength(0);
    expect(await db().select().from(schema.auditEvents)).toHaveLength(0);
  });
});
