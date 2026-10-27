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
import type { ownsFreeTenant } from '@blog/db/queries/tenants/owns-free-tenant';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data';
import * as schema from '@blog/db/schema';
import { MOCK_NOT_AN_ADDRESS } from '@blog/db/testing/blocked-signup-identities/fixtures';
import { insertTestUser } from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { unwrapOk } from '@blog/db/testing/tenants/fixtures';
import {
  MOCK_SELF_SERVE_DOMAIN,
  MOCK_SELF_SERVE_MISSING_USER_ID,
  MOCK_SELF_SERVE_NAME,
  MOCK_SELF_SERVE_OTHER_DOMAIN,
  MOCK_SELF_SERVE_OTHER_EMAIL,
  MOCK_SELF_SERVE_OTHER_USER_ID,
  MOCK_SELF_SERVE_OWNER_EMAIL,
  MOCK_SELF_SERVE_OWNER_ID,
  MOCK_SELF_SERVE_OWNER_SHOUTED_EMAIL,
  MOCK_SELF_SERVE_OWNER_TAGGED_EMAIL,
  MOCK_SELF_SERVE_PADDED_DOMAIN,
  MOCK_SELF_SERVE_SCHEME_DOMAIN,
} from '@blog/db/testing/tenants/self-serve-fixtures';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import {
  createSelfServeTenant,
  type TCreateSelfServeTenantInput,
} from './create-self-serve-tenant';

const {
  ownsFreeTenantMock,
  getTenantByDomainMock,
  insertAuditEventMock,
  OWNS_FREE_TENANT_MODULE,
  GET_TENANT_BY_DOMAIN_MODULE,
  INSERT_AUDIT_EVENT_MODULE,
} = vi.hoisted(() => ({
  ownsFreeTenantMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  OWNS_FREE_TENANT_MODULE: '@blog/db/queries/tenants/owns-free-tenant',
  GET_TENANT_BY_DOMAIN_MODULE:
    '@blog/db/queries/tenant-domains/get-tenant-by-domain',
  INSERT_AUDIT_EVENT_MODULE: '@blog/db/queries/audit-events/insert-audit-event',
}));

vi.mock('@blog/db/client');

vi.mock(OWNS_FREE_TENANT_MODULE, () => ({
  ownsFreeTenant: ownsFreeTenantMock,
}));

vi.mock(GET_TENANT_BY_DOMAIN_MODULE, () => ({
  getTenantByDomain: getTenantByDomainMock,
}));

vi.mock(INSERT_AUDIT_EVENT_MODULE, () => ({
  insertAuditEvent: insertAuditEventMock,
}));

faker.seed(6020);

const db = useQueryTestDb();
usePersonalDataKeys();

const MOCK_ACCENT_HUE = faker.number.int({ min: 0, max: 359 });
const MOCK_AUDIT_FAILURE = faker.lorem.sentence();

const MOCK_INPUT: TCreateSelfServeTenantInput = {
  name: MOCK_SELF_SERVE_NAME,
  domain: MOCK_SELF_SERVE_DOMAIN,
  locale: LOCALE_ISO_CODES.EN,
  siteType: SITE_TYPE.PORTFOLIO,
  preset: PRESET_ID.EDITORIAL,
  accentHue: MOCK_ACCENT_HUE,
  owner: {
    userId: MOCK_SELF_SERVE_OWNER_ID,
    email: MOCK_SELF_SERVE_OWNER_EMAIL,
  },
};

async function insertUser(id: string, email: string): Promise<void> {
  await insertTestUser(db(), {
    id,
    email,
    ...userPersonalColumns({ email }),
  });
}

function submitAs(userId: string, email: string, domain: string) {
  return createSelfServeTenant({
    ...MOCK_INPUT,
    domain,
    owner: { userId, email },
  });
}

async function countRows() {
  const [
    tenants,
    memberships,
    tenantDomains,
    siteConfig,
    settingsFeatures,
    auditEvents,
  ] = await Promise.all([
    db().select().from(schema.tenants),
    db().select().from(schema.memberships),
    db().select().from(schema.tenantDomains),
    db().select().from(schema.siteConfig),
    db().select().from(schema.settingsFeatures),
    db().select().from(schema.auditEvents),
  ]);

  return {
    tenants: tenants.length,
    memberships: memberships.length,
    tenantDomains: tenantDomains.length,
    siteConfig: siteConfig.length,
    settingsFeatures: settingsFeatures.length,
    auditEvents: auditEvents.length,
  };
}

const MOCK_NO_ROWS = {
  tenants: 0,
  memberships: 0,
  tenantDomains: 0,
  siteConfig: 0,
  settingsFeatures: 0,
  auditEvents: 0,
};

const MOCK_ONE_SITE_ROWS = {
  tenants: 1,
  memberships: 1,
  tenantDomains: 1,
  siteConfig: 1,
  settingsFeatures: 1,
  auditEvents: 1,
};

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
    await insertUser(MOCK_SELF_SERVE_OWNER_ID, MOCK_SELF_SERVE_OWNER_EMAIL);
  });

  describe('for a person with no Free tenant', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = unwrapOk(await createSelfServeTenant(MOCK_INPUT)));
    });

    it('inserts a PENDING Free tenant with the site type and no template version', async () => {
      const [row] = await db().select().from(schema.tenants);
      const {
        name,
        primaryDomain,
        locale,
        plan,
        status,
        provisioningStatus,
        siteType,
        siteTemplateVersion,
        sanityProjectId,
      } = row ?? {};

      expect({
        name,
        primaryDomain,
        locale,
        plan,
        status,
        provisioningStatus,
        siteType,
        siteTemplateVersion,
        sanityProjectId,
      }).toEqual({
        name: MOCK_SELF_SERVE_NAME,
        primaryDomain: MOCK_SELF_SERVE_DOMAIN,
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
      const memberships = await db()
        .select({
          userId: schema.memberships.userId,
          role: schema.memberships.role,
        })
        .from(schema.memberships)
        .where(eq(schema.memberships.tenantId, tenantId));
      const domains = await db()
        .select({ domain: schema.tenantDomains.domain })
        .from(schema.tenantDomains)
        .where(eq(schema.tenantDomains.tenantId, tenantId));

      expect(memberships).toEqual([
        { userId: MOCK_SELF_SERVE_OWNER_ID, role: MEMBERSHIP_ROLE.OWNER },
      ]);
      expect(domains).toEqual([{ domain: MOCK_SELF_SERVE_DOMAIN }]);
    });

    it('stores the chosen preset and accent hue in site_config', async () => {
      const configs = await db()
        .select({
          preset: schema.siteConfig.preset,
          accentHue: schema.siteConfig.accentHue,
        })
        .from(schema.siteConfig)
        .where(eq(schema.siteConfig.tenantId, tenantId));

      expect(configs).toEqual([
        { preset: PRESET_ID.EDITORIAL, accentHue: MOCK_ACCENT_HUE },
      ]);
    });

    it('creates the settings_features row', async () => {
      const rows = await db()
        .select({ tenantId: schema.settingsFeatures.tenantId })
        .from(schema.settingsFeatures);

      expect(rows).toEqual([{ tenantId }]);
    });

    it('records a CREATED audit event on the tenant, acted by the owner', async () => {
      const events = await db()
        .select({
          actorId: schema.auditEvents.actorId,
          action: schema.auditEvents.action,
          targetType: schema.auditEvents.targetType,
          targetId: schema.auditEvents.targetId,
        })
        .from(schema.auditEvents);

      expect(events).toEqual([
        {
          actorId: MOCK_SELF_SERVE_OWNER_ID,
          action: AUDIT_ACTION.CREATED,
          targetType: AUDIT_TARGET_TYPE.TENANT,
          targetId: tenantId,
        },
      ]);
    });
  });

  describe('the owner and the one-Free-tenant guard', () => {
    it('records the normalised owner address index on the tenant', async () => {
      const { selfServeOwnerEmailIndex } = unwrapOk(
        await createSelfServeTenant({
          ...MOCK_INPUT,
          owner: {
            userId: MOCK_SELF_SERVE_OWNER_ID,
            email: MOCK_SELF_SERVE_OWNER_SHOUTED_EMAIL,
          },
        }),
      );

      expect(selfServeOwnerEmailIndex).toBe(
        testPersonalEmailIndex(MOCK_SELF_SERVE_OWNER_EMAIL),
      );
    });

    it('frees the slot once the person Free tenant is archived', async () => {
      const { id } = unwrapOk(await createSelfServeTenant(MOCK_INPUT));
      await db()
        .update(schema.tenants)
        .set({ status: TENANT_STATUS.ARCHIVED })
        .where(eq(schema.tenants.id, id));

      const second = await createSelfServeTenant({
        ...MOCK_INPUT,
        domain: MOCK_SELF_SERVE_OTHER_DOMAIN,
      });

      const [secondTenant] = await db()
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.primaryDomain, MOCK_SELF_SERVE_OTHER_DOMAIN));
      expect(second).toEqual(okResult(secondTenant));
    });
  });

  describe('when a second person submits after the first created a site', () => {
    beforeEach(async () => {
      await insertUser(
        MOCK_SELF_SERVE_OTHER_USER_ID,
        MOCK_SELF_SERVE_OTHER_EMAIL,
      );
      await createSelfServeTenant(MOCK_INPUT);
    });

    it.each([
      ['seen by the pre-check', false],
      ['taken by a racing submit', true],
    ])('refuses a domain %s and leaves nothing behind', async (_, racing) => {
      if (racing) getTenantByDomainMock.mockResolvedValueOnce(undefined);

      const result = await submitAs(
        MOCK_SELF_SERVE_OTHER_USER_ID,
        MOCK_SELF_SERVE_OTHER_EMAIL,
        MOCK_SELF_SERVE_DOMAIN,
      );

      const rowCounts = await countRows();
      expect(result).toEqual(errorResult(ERROR_CODE.DB_DUPLICATE_DOMAIN));
      expect(rowCounts).toEqual(MOCK_ONE_SITE_ROWS);
    });

    it('refuses the same address through the database index when the pre-check races', async () => {
      ownsFreeTenantMock.mockResolvedValueOnce(okResult(false));

      const result = await submitAs(
        MOCK_SELF_SERVE_OTHER_USER_ID,
        MOCK_SELF_SERVE_OWNER_TAGGED_EMAIL,
        MOCK_SELF_SERVE_OTHER_DOMAIN,
      );

      const rowCounts = await countRows();
      expect(result).toEqual(
        errorResult(ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT),
      );
      expect(rowCounts).toEqual(MOCK_ONE_SITE_ROWS);
    });
  });

  describe('refusals', () => {
    it.each([
      ['the same address', MOCK_SELF_SERVE_OWNER_EMAIL],
      ['a +tag variant of it', MOCK_SELF_SERVE_OWNER_TAGGED_EMAIL],
      ['a differently cased variant', MOCK_SELF_SERVE_OWNER_SHOUTED_EMAIL],
    ])(
      'refuses a second Free tenant for %s and writes nothing',
      async (_, email) => {
        await createSelfServeTenant(MOCK_INPUT);

        const result = await submitAs(
          MOCK_SELF_SERVE_OWNER_ID,
          email,
          MOCK_SELF_SERVE_OTHER_DOMAIN,
        );

        const rowCounts = await countRows();
        expect(result).toEqual(
          errorResult(ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT),
        );
        expect(rowCounts).toEqual(MOCK_ONE_SITE_ROWS);
      },
    );

    it.each([
      ['a scheme-prefixed value', MOCK_SELF_SERVE_SCHEME_DOMAIN],
      ['a whitespace-padded value', MOCK_SELF_SERVE_PADDED_DOMAIN],
    ])('refuses %s as the domain and writes nothing', async (_, domain) => {
      const result = await createSelfServeTenant({ ...MOCK_INPUT, domain });

      const rowCounts = await countRows();
      expect(result).toEqual(errorResult(ERROR_CODE.DB_INVALID_DOMAIN));
      expect(rowCounts).toEqual(MOCK_NO_ROWS);
    });

    it('refuses an owner email that is not an address and writes nothing', async () => {
      const result = await createSelfServeTenant({
        ...MOCK_INPUT,
        owner: { userId: MOCK_SELF_SERVE_OWNER_ID, email: MOCK_NOT_AN_ADDRESS },
      });

      const rowCounts = await countRows();
      expect(result).toEqual(errorResult(ERROR_CODE.DB_INVALID_EMAIL));
      expect(rowCounts).toEqual(MOCK_NO_ROWS);
    });
  });

  it('rolls back the tenant and every row it wrote when the audit event fails', async () => {
    const auditFailure = new Error(MOCK_AUDIT_FAILURE);
    insertAuditEventMock.mockRejectedValueOnce(auditFailure);

    await expect(createSelfServeTenant(MOCK_INPUT)).rejects.toBe(auditFailure);

    const rowCounts = await countRows();
    expect(rowCounts).toEqual(MOCK_NO_ROWS);
  });

  it('rolls back every row when the owner user does not exist', async () => {
    await expect(
      createSelfServeTenant({
        ...MOCK_INPUT,
        owner: {
          userId: MOCK_SELF_SERVE_MISSING_USER_ID,
          email: MOCK_SELF_SERVE_OTHER_EMAIL,
        },
      }),
    ).rejects.toThrow();

    const rowCounts = await countRows();
    expect(rowCounts).toEqual(MOCK_NO_ROWS);
  });
});
