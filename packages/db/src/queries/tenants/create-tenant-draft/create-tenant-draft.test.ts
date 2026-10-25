import { ERROR_CODE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { MOCK_OWNER_EMAIL, insertTestUser } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_TENANT_DOMAIN,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import {
  createTenantDraft,
  type TCreateTenantDraftInput,
} from './create-tenant-draft';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();

const SECOND_OWNER_EMAIL = 'owner-2@example.com';
const OWNER_USER_ID = 'user-1';
const SECOND_OWNER_USER_ID = 'user-2';

const draftInput: TCreateTenantDraftInput = {
  name: 'Acme',
  domain: MOCK_TENANT_DOMAIN,
  locale: LOCALE_ISO_CODES.EN,
  plan: TENANT_PLAN.FREE,
  owner: { type: 'user', userId: OWNER_USER_ID },
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
      await insertTestUser(db(), { id: OWNER_USER_ID });
    });

    it('inserts a PENDING tenant with idle steps and no Sanity project yet', async () => {
      const tenant = unwrapOk(await createTenantDraft(draftInput));

      expect(tenant).toMatchObject({
        name: 'Acme',
        primaryDomain: MOCK_TENANT_DOMAIN,
        locale: LOCALE_ISO_CODES.EN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
        sanityProjectId: null,
        sanityDataset: null,
      });
      expect(tenant.provisioningSteps).toEqual(MOCK_IDLE_PROVISIONING_STEPS);
    });

    it('starts the tenant with its last activity set and no inactivity stamps', async () => {
      const tenant = unwrapOk(await createTenantDraft(draftInput));

      expect(tenant.lastActivityAt).toBeInstanceOf(Date);
      expect(tenant).toMatchObject({
        inactivityWarnedAt: null,
        suspendedAt: null,
        deletionNotifiedAt: null,
        suspensionReason: null,
      });
    });

    it('inserts the primary domain into tenant_domains', async () => {
      const { id: tenantId } = unwrapOk(await createTenantDraft(draftInput));

      const [domainRow] = await db()
        .select()
        .from(schema.tenantDomains)
        .where(eq(schema.tenantDomains.tenantId, tenantId));

      expect(domainRow).toMatchObject({
        tenantId: tenantId,
        domain: MOCK_TENANT_DOMAIN,
      });
    });

    it('inserts an OWNER membership row for the given owner user id', async () => {
      const { id: tenantId } = unwrapOk(await createTenantDraft(draftInput));

      const [membershipRow] = await db()
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.tenantId, tenantId));

      expect(membershipRow).toMatchObject({
        tenantId: tenantId,
        userId: OWNER_USER_ID,
        role: MEMBERSHIP_ROLE.OWNER,
      });
    });

    it('rejects a colliding domain and cleans up the second tenant and dependents', async () => {
      await insertTestUser(db(), { id: SECOND_OWNER_USER_ID });
      await createTenantDraft(draftInput);

      await expect(
        createTenantDraft({
          ...draftInput,
          owner: { type: 'user', userId: SECOND_OWNER_USER_ID },
        }),
      ).rejects.toThrow();

      const tenantRows = await db().select().from(schema.tenants);
      expect(tenantRows).toHaveLength(1);

      const secondMembershipRows = await db()
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.userId, SECOND_OWNER_USER_ID));
      expect(secondMembershipRows).toHaveLength(0);

      const domainRows = await db()
        .select()
        .from(schema.tenantDomains)
        .where(eq(schema.tenantDomains.domain, draftInput.domain));
      expect(domainRows).toHaveLength(1);
    });

    it.each([
      ['a scheme-prefixed value', 'https://acme.com'],
      ['a trailing-slash value', 'acme.com/'],
      ['a whitespace-padded value', ' acme.com '],
    ])(
      'rejects %s for domain without writing any row',
      async (_description, domain) => {
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

  it('invites an owner with no resolved user instead of adding a membership', async () => {
    const { id: tenantId } = unwrapOk(
      await createTenantDraft({
        ...draftInput,
        owner: { type: 'invite', email: MOCK_OWNER_EMAIL.toUpperCase() },
      }),
    );

    const [inviteRow] = await db()
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.tenantId, tenantId));

    expect(inviteRow).toMatchObject({
      tenantId: tenantId,
      email: MOCK_OWNER_EMAIL,
      emailIndex: testPersonalEmailIndex(MOCK_OWNER_EMAIL),
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: null,
    });
    expect(decryptTestPersonalValue(inviteRow?.emailEncrypted ?? null)).toBe(
      MOCK_OWNER_EMAIL,
    );

    const membershipRows = await db()
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, tenantId));
    expect(membershipRows).toHaveLength(0);
  });

  it('rejects an unknown owner user id and leaves no orphaned tenant or domain', async () => {
    await expect(createTenantDraft(draftInput)).rejects.toThrow();

    const tenantRows = await db().select().from(schema.tenants);
    expect(tenantRows).toHaveLength(0);

    const domainRows = await db()
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.domain, draftInput.domain));
    expect(domainRows).toHaveLength(0);
  });

  it('rejects a colliding domain for an invited owner and cleans up its invite', async () => {
    await createTenantDraft({
      ...draftInput,
      owner: { type: 'invite', email: MOCK_OWNER_EMAIL },
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
});
