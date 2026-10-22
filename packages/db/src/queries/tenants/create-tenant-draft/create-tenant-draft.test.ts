import { ERROR_CODE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import {
  createTenantDraft,
  type TCreateTenantDraftInput,
} from './create-tenant-draft';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const DOMAIN = 'acme.example.com';
const OWNER_EMAIL = 'owner@example.com';
const SECOND_OWNER_EMAIL = 'owner-2@example.com';
const EXPECTED_OK = 'expected ok:true';
const IDLE = { status: TENANT_PROVISIONING_STEP_STATUS.IDLE };

const draftInput: TCreateTenantDraftInput = {
  name: 'Acme',
  domain: DOMAIN,
  locale: LOCALE_ISO_CODES.EN,
  plan: TENANT_PLAN.FREE,
  owner: { type: 'user', userId: 'user-1' },
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
      await insertTestUser(db(), { id: 'user-1' });
    });

    it('inserts a tenant row left in PENDING with an idle per-step map and no Sanity project yet', async () => {
      const result = await createTenantDraft(draftInput);

      if (!result.ok) throw new Error(EXPECTED_OK);
      expect(result.data).toMatchObject({
        name: 'Acme',
        primaryDomain: DOMAIN,
        locale: LOCALE_ISO_CODES.EN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        sanityProjectId: null,
        sanityDataset: null,
      });
      expect(result.data.provisioningSteps).toEqual({
        SANITY_PROJECT: IDLE,
        SEED_CONTENT: IDLE,
        PERSIST_TOKEN: IDLE,
        MAP_DOMAIN: IDLE,
        CREATE_WEBHOOK: IDLE,
        VERIFY_CONTENT: IDLE,
        OWNER_ELEVATION: IDLE,
      });
    });

    it('starts the tenant with its last activity set and no inactivity stamps', async () => {
      const result = await createTenantDraft(draftInput);

      if (!result.ok) throw new Error(EXPECTED_OK);
      expect(result.data.lastActivityAt).toBeInstanceOf(Date);
      expect(result.data).toMatchObject({
        inactivityWarnedAt: null,
        suspendedAt: null,
        deletionNotifiedAt: null,
        suspensionReason: null,
      });
    });

    it('inserts the primary domain into tenant_domains', async () => {
      const result = await createTenantDraft(draftInput);

      if (!result.ok) throw new Error(EXPECTED_OK);
      const [domainRow] = await db()
        .select()
        .from(schema.tenantDomains)
        .where(eq(schema.tenantDomains.tenantId, result.data.id));

      expect(domainRow).toMatchObject({
        tenantId: result.data.id,
        domain: DOMAIN,
      });
    });

    it('inserts an OWNER membership row for the given owner user id', async () => {
      const result = await createTenantDraft(draftInput);

      if (!result.ok) throw new Error(EXPECTED_OK);
      const [membershipRow] = await db()
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.tenantId, result.data.id));

      expect(membershipRow).toMatchObject({
        tenantId: result.data.id,
        userId: 'user-1',
        role: MEMBERSHIP_ROLE.OWNER,
      });
    });

    it('rejects on a colliding domain and leaves the second tenant and its dependents cleaned up', async () => {
      await insertTestUser(db(), { id: 'user-2' });
      await createTenantDraft(draftInput);

      await expect(
        createTenantDraft({
          ...draftInput,
          owner: { type: 'user', userId: 'user-2' },
        }),
      ).rejects.toThrow();

      const tenantRows = await db().select().from(schema.tenants);
      expect(tenantRows).toHaveLength(1);

      const secondMembershipRows = await db()
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.userId, 'user-2'));
      expect(secondMembershipRows).toHaveLength(0);

      const domainRows = await db()
        .select()
        .from(schema.tenantDomains)
        .where(eq(schema.tenantDomains.domain, draftInput.domain));
      expect(domainRows).toHaveLength(1);
    });
  });

  it('inserts a pending OWNER membershipInvites row instead of a membership when the owner has no resolved user yet', async () => {
    const result = await createTenantDraft({
      ...draftInput,
      owner: { type: 'invite', email: 'Owner@Example.com' },
    });

    if (!result.ok) throw new Error(EXPECTED_OK);

    const [inviteRow] = await db()
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.tenantId, result.data.id));

    expect(inviteRow).toMatchObject({
      tenantId: result.data.id,
      email: OWNER_EMAIL,
      emailIndex: testPersonalEmailIndex(OWNER_EMAIL),
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: null,
    });
    expect(decryptTestPersonalValue(inviteRow?.emailEncrypted ?? null)).toBe(
      OWNER_EMAIL,
    );

    const membershipRows = await db()
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, result.data.id));
    expect(membershipRows).toHaveLength(0);
  });

  it('rejects when the owner user id does not exist, and leaves no orphaned tenant or domain row behind', async () => {
    await expect(createTenantDraft(draftInput)).rejects.toThrow();

    const tenantRows = await db().select().from(schema.tenants);
    expect(tenantRows).toHaveLength(0);

    const domainRows = await db()
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.domain, draftInput.domain));
    expect(domainRows).toHaveLength(0);
  });

  it('rejects on a colliding domain for an invite-email owner, and leaves the second tenant and its invite cleaned up', async () => {
    await createTenantDraft({
      ...draftInput,
      owner: { type: 'invite', email: OWNER_EMAIL },
    });

    await expect(
      createTenantDraft({
        ...draftInput,
        owner: { type: 'invite', email: SECOND_OWNER_EMAIL },
      }),
    ).rejects.toThrow();

    const tenantRows = await db().select().from(schema.tenants);
    expect(tenantRows).toHaveLength(1);

    const secondInviteRows = await db()
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.email, SECOND_OWNER_EMAIL));
    expect(secondInviteRows).toHaveLength(0);
  });

  it.each([
    ['a scheme-prefixed value', 'https://acme.com'],
    ['a trailing-slash value', 'acme.com/'],
    ['a whitespace-padded value', ' acme.com '],
  ])(
    'rejects %s for domain without writing any row',
    async (_description, domain) => {
      await insertTestUser(db(), { id: 'user-1' });

      const result = await createTenantDraft({ ...draftInput, domain });

      expect(result).toEqual({
        ok: false,
        error: ERROR_CODE.DB_INVALID_DOMAIN,
      });

      const tenantRows = await db().select().from(schema.tenants);
      expect(tenantRows).toHaveLength(0);

      const domainRows = await db().select().from(schema.tenantDomains);
      expect(domainRows).toHaveLength(0);

      const membershipRows = await db().select().from(schema.memberships);
      expect(membershipRows).toHaveLength(0);
    },
  );
});
