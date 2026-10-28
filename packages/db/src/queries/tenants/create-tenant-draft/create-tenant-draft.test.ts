import { ERROR_CODE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestUser, MOCK_OWNER_EMAIL } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_VALUES,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';
import {
  MOCK_SELF_SERVE_DOMAIN,
  MOCK_SELF_SERVE_PADDED_DOMAIN,
  MOCK_SELF_SERVE_SCHEME_DOMAIN,
} from '@blog/db/testing/tenants/self-serve-fixtures';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import {
  createTenantDraft,
  type TCreateTenantDraftInput,
} from './create-tenant-draft';

vi.mock('@blog/db/client');

faker.seed(6020);

const db = useQueryTestDb();

const MOCK_SECOND_OWNER_EMAIL = faker.internet.email().toLowerCase();
const MOCK_OWNER_USER_ID = faker.string.uuid();
const MOCK_SECOND_OWNER_USER_ID = faker.string.uuid();

const MOCK_DRAFT_INPUT: TCreateTenantDraftInput = {
  name: MOCK_TENANT_VALUES.name,
  domain: MOCK_TENANT_DOMAIN,
  locale: LOCALE_ISO_CODES.EN,
  plan: TENANT_PLAN.FREE,
  owner: { type: 'user', userId: MOCK_OWNER_USER_ID },
};

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(createTenantDraft, () => {
  describe('with an existing owner user', () => {
    beforeEach(async () => {
      await insertTestUser(db(), { id: MOCK_OWNER_USER_ID });
    });

    it('inserts a PENDING tenant with idle steps and no Sanity project yet', async () => {
      const result = await createTenantDraft(MOCK_DRAFT_INPUT);

      const [row] = await db().select().from(schema.tenants);
      const {
        name,
        primaryDomain,
        locale,
        plan,
        status,
        provisioningStatus,
        provisioningSteps,
        sanityProjectId,
        sanityDataset,
      } = row ?? {};
      expect(result).toEqual({ ok: true, data: row });
      expect({
        name,
        primaryDomain,
        locale,
        plan,
        status,
        provisioningStatus,
        provisioningSteps,
        sanityProjectId,
        sanityDataset,
      }).toEqual({
        name: MOCK_TENANT_VALUES.name,
        primaryDomain: MOCK_TENANT_DOMAIN,
        locale: LOCALE_ISO_CODES.EN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        provisioningSteps: MOCK_IDLE_PROVISIONING_STEPS,
        sanityProjectId: null,
        sanityDataset: null,
      });
    });

    it('starts the tenant active as of its creation, with no inactivity stamps', async () => {
      const {
        createdAt,
        lastActivityAt,
        inactivityWarnedAt,
        suspendedAt,
        deletionNotifiedAt,
        suspensionReason,
      } = unwrapOk(await createTenantDraft(MOCK_DRAFT_INPUT));

      expect(lastActivityAt).toEqual(createdAt);
      expect({
        inactivityWarnedAt,
        suspendedAt,
        deletionNotifiedAt,
        suspensionReason,
      }).toEqual({
        inactivityWarnedAt: null,
        suspendedAt: null,
        deletionNotifiedAt: null,
        suspensionReason: null,
      });
    });

    it('inserts the primary domain into tenant_domains', async () => {
      const { id: tenantId } = unwrapOk(
        await createTenantDraft(MOCK_DRAFT_INPUT),
      );

      const domainRows = await db()
        .select({
          tenantId: schema.tenantDomains.tenantId,
          domain: schema.tenantDomains.domain,
        })
        .from(schema.tenantDomains);
      expect(domainRows).toEqual([{ tenantId, domain: MOCK_TENANT_DOMAIN }]);
    });

    it('inserts an OWNER membership row for the given owner user id', async () => {
      const { id: tenantId } = unwrapOk(
        await createTenantDraft(MOCK_DRAFT_INPUT),
      );

      const membershipRows = await db()
        .select({
          tenantId: schema.memberships.tenantId,
          userId: schema.memberships.userId,
          role: schema.memberships.role,
        })
        .from(schema.memberships);
      expect(membershipRows).toEqual([
        { tenantId, userId: MOCK_OWNER_USER_ID, role: MEMBERSHIP_ROLE.OWNER },
      ]);
    });

    it('rejects a colliding domain and cleans up the second tenant and dependents', async () => {
      await insertTestUser(db(), { id: MOCK_SECOND_OWNER_USER_ID });
      const firstTenant = unwrapOk(await createTenantDraft(MOCK_DRAFT_INPUT));

      await expect(
        createTenantDraft({
          ...MOCK_DRAFT_INPUT,
          owner: { type: 'user', userId: MOCK_SECOND_OWNER_USER_ID },
        }),
      ).rejects.toThrow();

      const tenantRows = await db().select().from(schema.tenants);
      const secondMembershipRows = await db()
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.userId, MOCK_SECOND_OWNER_USER_ID));
      const domainRows = await db()
        .select({ tenantId: schema.tenantDomains.tenantId })
        .from(schema.tenantDomains);
      expect(tenantRows).toEqual([firstTenant]);
      expect(secondMembershipRows).toEqual([]);
      expect(domainRows).toEqual([{ tenantId: firstTenant.id }]);
    });

    it.each([
      ['a scheme-prefixed value', MOCK_SELF_SERVE_SCHEME_DOMAIN],
      ['a trailing-slash value', `${MOCK_SELF_SERVE_DOMAIN}/`],
      ['a whitespace-padded value', MOCK_SELF_SERVE_PADDED_DOMAIN],
    ])(
      'rejects %s for domain without writing any row',
      async (_description, domain) => {
        const result = await createTenantDraft({ ...MOCK_DRAFT_INPUT, domain });

        const tenantRows = await db().select().from(schema.tenants);
        const domainRows = await db().select().from(schema.tenantDomains);
        const membershipRows = await db().select().from(schema.memberships);
        expect(result).toEqual({
          ok: false,
          error: ERROR_CODE.DB_INVALID_DOMAIN,
        });
        expect(tenantRows).toEqual([]);
        expect(domainRows).toEqual([]);
        expect(membershipRows).toEqual([]);
      },
    );
  });

  it('invites an owner with no resolved user, adding no membership', async () => {
    const { id: tenantId } = unwrapOk(
      await createTenantDraft({
        ...MOCK_DRAFT_INPUT,
        owner: { type: 'invite', email: MOCK_OWNER_EMAIL.toUpperCase() },
      }),
    );

    const [inviteRow] = await db()
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.tenantId, tenantId));
    const membershipRows = await db()
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, tenantId));
    const { emailIndex, role, consumedAt, emailEncrypted } = inviteRow ?? {};
    expect({ emailIndex, role, consumedAt }).toEqual({
      emailIndex: testPersonalEmailIndex(MOCK_OWNER_EMAIL),
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: null,
    });
    expect(decryptTestPersonalValue(emailEncrypted ?? null)).toBe(
      MOCK_OWNER_EMAIL,
    );
    expect(membershipRows).toEqual([]);
  });

  it('rejects an unknown owner user id and leaves no orphaned tenant or domain', async () => {
    await expect(createTenantDraft(MOCK_DRAFT_INPUT)).rejects.toThrow();

    const tenantRows = await db().select().from(schema.tenants);
    const domainRows = await db().select().from(schema.tenantDomains);
    expect(tenantRows).toEqual([]);
    expect(domainRows).toEqual([]);
  });

  it('rejects a colliding domain for an invited owner and cleans up its invite', async () => {
    const firstTenant = unwrapOk(
      await createTenantDraft({
        ...MOCK_DRAFT_INPUT,
        owner: { type: 'invite', email: MOCK_OWNER_EMAIL },
      }),
    );

    await expect(
      createTenantDraft({
        ...MOCK_DRAFT_INPUT,
        owner: { type: 'invite', email: MOCK_SECOND_OWNER_EMAIL },
      }),
    ).rejects.toThrow();

    const tenantRows = await db().select().from(schema.tenants);
    const secondInviteRows = await db()
      .select()
      .from(schema.membershipInvites)
      .where(
        eq(
          schema.membershipInvites.emailIndex,
          testPersonalEmailIndex(MOCK_SECOND_OWNER_EMAIL),
        ),
      );
    expect(tenantRows).toEqual([firstTenant]);
    expect(secondInviteRows).toEqual([]);
  });
});
