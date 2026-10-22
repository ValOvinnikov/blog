import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
  type TTenantProvisioningStatus,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { users } from '@blog/db/schema/auth';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import {
  tenants,
  type TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { SELF_SERVE_OWNER_EMAIL } from '@blog/db/testing/tenants/self-serve-fixtures';
import { encryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { and, eq } from 'drizzle-orm';

import {
  OWNS_FREE_TENANT_OUTCOME,
  updateTenantDetails,
  type TUpdateTenantDetailsInput,
} from './update-tenant-details';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const ACME_DOMAIN = 'acme.example.com';
const ACME_NEW_DOMAIN = 'acme-new.example.com';
const ACME_ALT_DOMAIN = 'acme-alt.example.com';
const ACME_FIXED_DOMAIN = 'acme-fixed.example.com';
const GLOBEX_DOMAIN = 'globex.example.com';
const OWNER_EMAIL = 'owner@example.com';
const NEW_OWNER_EMAIL = 'new-owner@example.com';
const UNNORMALIZED_NEW_OWNER_EMAIL = '  New-Owner@Example.com  ';
const MEMBER_EMAIL = 'member@example.com';
const OWNER_ALREADY_JOINED = 'owner-already-joined';
const PROVISIONING_STARTED = 'provisioning-started';
const DOMAIN_TAKEN = 'domain-taken';
const DOMAIN_LOCKED = 'domain-locked';
usePersonalDataKeys();

const validInput: TUpdateTenantDetailsInput = {
  name: 'Acme Updated',
  primaryDomain: ACME_DOMAIN,
  plan: TENANT_PLAN.FREE,
  locale: LOCALE_ISO_CODES.EN,
};

async function insertTenantWithDomain(overrides?: {
  domain?: string;
  sanityProjectId?: string;
  provisioningStatus?: TTenantProvisioningStatus;
  provisioningSteps?: TTenantProvisioningState;
}): Promise<string> {
  const domain = overrides?.domain ?? ACME_DOMAIN;

  const tenant = await insertTestTenant(db(), {
    name: 'Acme',
    primaryDomain: domain,
    sanityProjectId: overrides?.sanityProjectId,
    provisioningStatus: overrides?.provisioningStatus,
    provisioningSteps: overrides?.provisioningSteps,
  });

  await db().insert(tenantDomains).values({ tenantId: tenant.id, domain });

  return tenant.id;
}

async function insertOwnerInvite(
  tenantId: string,
  email: string,
): Promise<string> {
  const [invite] = await db()
    .insert(membershipInvites)
    .values({
      tenantId,
      email,
      emailEncrypted: encryptPersonalValue(email),
      role: MEMBERSHIP_ROLE.OWNER,
    })
    .returning();

  if (!invite)
    throw new Error('setup: membership invite insert returned no row.');

  return invite.id;
}

async function insertJoinedOwner(
  tenantId: string,
  email?: string,
): Promise<void> {
  const [user] = await db().insert(users).values({ email }).returning();
  if (!user) throw new Error('setup: user insert returned no row.');

  await db()
    .insert(memberships)
    .values({ tenantId, userId: user.id, role: MEMBERSHIP_ROLE.OWNER });
}

function stepsWith(
  overrides: Partial<TTenantProvisioningState>,
): TTenantProvisioningState {
  const idle = { status: TENANT_PROVISIONING_STEP_STATUS.IDLE };
  return {
    SANITY_PROJECT: idle,
    SEED_CONTENT: idle,
    PERSIST_TOKEN: idle,
    MAP_DOMAIN: idle,
    CREATE_WEBHOOK: idle,
    VERIFY_CONTENT: idle,
    OWNER_ELEVATION: idle,
    ...overrides,
  };
}

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(updateTenantDetails, () => {
  describe('a tenant with the default domain and no provisioning steps', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenantWithDomain();
    });

    it('updates the editable fields and returns the updated row', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        name: 'New Name',
        locale: LOCALE_ISO_CODES.FR,
        plan: TENANT_PLAN.GROWTH,
      });

      if (result.outcome !== 'updated') {
        throw new Error(`expected 'updated', got '${result.outcome}'`);
      }
      expect(result.tenant).toMatchObject({
        name: 'New Name',
        locale: LOCALE_ISO_CODES.FR,
        plan: TENANT_PLAN.GROWTH,
      });
    });
    it('updates primaryDomain and moves the matching tenant_domains row with it', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        primaryDomain: ACME_NEW_DOMAIN,
      });

      if (result.outcome !== 'updated') {
        throw new Error(`expected 'updated', got '${result.outcome}'`);
      }
      expect(result.tenant.primaryDomain).toBe(ACME_NEW_DOMAIN);

      const domainRows = await db()
        .select()
        .from(tenantDomains)
        .where(eq(tenantDomains.tenantId, tenantId));

      expect(domainRows).toHaveLength(1);
      expect(domainRows[0]).toMatchObject({ domain: ACME_NEW_DOMAIN });
    });
    it('still updates when provisioningSteps is null', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        name: 'New Name',
      });

      expect(result).toMatchObject({
        outcome: 'updated',
        tenant: { name: 'New Name' },
      });
    });
    describe('with a pending owner invite', () => {
      beforeEach(async () => {
        await insertOwnerInvite(tenantId, OWNER_EMAIL);
      });

      it('updates the pending owner invite email, normalized, when ownerEmail is supplied', async () => {
        const result = await updateTenantDetails(tenantId, {
          ...validInput,
          ownerEmail: UNNORMALIZED_NEW_OWNER_EMAIL,
        });

        expect(result).toMatchObject({ outcome: 'updated' });

        const [invite] = await db()
          .select()
          .from(membershipInvites)
          .where(eq(membershipInvites.tenantId, tenantId));
        expect(invite?.email).toBe(NEW_OWNER_EMAIL);
      });
      it("rewrites the pending owner invite's index and encrypted email to the new address", async () => {
        await updateTenantDetails(tenantId, {
          ...validInput,
          ownerEmail: UNNORMALIZED_NEW_OWNER_EMAIL,
        });

        const [invite] = await db()
          .select()
          .from(membershipInvites)
          .where(eq(membershipInvites.tenantId, tenantId));
        expect(invite?.emailIndex).toBe(
          testPersonalEmailIndex(NEW_OWNER_EMAIL),
        );
        expect(decryptTestPersonalValue(invite?.emailEncrypted ?? null)).toBe(
          NEW_OWNER_EMAIL,
        );
      });
      it('leaves the pending owner invite untouched when ownerEmail is omitted', async () => {
        const result = await updateTenantDetails(tenantId, {
          ...validInput,
          name: 'New Name',
        });

        expect(result).toMatchObject({ outcome: 'updated' });

        const [invite] = await db()
          .select()
          .from(membershipInvites)
          .where(eq(membershipInvites.tenantId, tenantId));
        expect(invite?.email).toBe(OWNER_EMAIL);
      });
      it('returns owner-email-taken and leaves the invite untouched when the new email collides with another invite on the tenant', async () => {
        await db().insert(membershipInvites).values({
          tenantId,
          email: MEMBER_EMAIL,
          role: MEMBERSHIP_ROLE.EDITOR,
        });

        const result = await updateTenantDetails(tenantId, {
          ...validInput,
          ownerEmail: MEMBER_EMAIL,
        });

        expect(result).toEqual({ outcome: 'owner-email-taken' });

        const [ownerInvite] = await db()
          .select()
          .from(membershipInvites)
          .where(
            and(
              eq(membershipInvites.tenantId, tenantId),
              eq(membershipInvites.role, MEMBERSHIP_ROLE.OWNER),
            ),
          );
        expect(ownerInvite?.email).toBe(OWNER_EMAIL);
      });
      it('leaves the pending invite untouched when ownerEmail resubmits its unchanged email', async () => {
        const result = await updateTenantDetails(tenantId, {
          ...validInput,
          name: 'New Name',
          ownerEmail: OWNER_EMAIL,
        });

        expect(result).toMatchObject({
          outcome: 'updated',
          tenant: { name: 'New Name' },
        });

        const [invite] = await db()
          .select()
          .from(membershipInvites)
          .where(eq(membershipInvites.tenantId, tenantId));
        expect(invite?.email).toBe(OWNER_EMAIL);
      });
    });
    describe('with a joined owner who has an email', () => {
      beforeEach(async () => {
        await insertJoinedOwner(tenantId, OWNER_EMAIL);
      });

      it("applies the rest of the update instead of returning owner-already-joined when ownerEmail resubmits the joined owner's unchanged email", async () => {
        const result = await updateTenantDetails(tenantId, {
          ...validInput,
          name: 'New Name',
          ownerEmail: OWNER_EMAIL,
        });

        if (result.outcome !== 'updated') {
          throw new Error(`expected 'updated', got '${result.outcome}'`);
        }
        expect(result.tenant.name).toBe('New Name');
      });
      it("treats a case/whitespace-only difference from the joined owner's email as unchanged and applies the update", async () => {
        const result = await updateTenantDetails(tenantId, {
          ...validInput,
          name: 'New Name',
          ownerEmail: '  Owner@Example.COM  ',
        });

        if (result.outcome !== 'updated') {
          throw new Error(`expected 'updated', got '${result.outcome}'`);
        }
        expect(result.tenant.name).toBe('New Name');
      });
      it("still returns owner-already-joined and applies no changes when ownerEmail differs from the joined owner's email", async () => {
        const result = await updateTenantDetails(tenantId, {
          ...validInput,
          name: 'New Name',
          ownerEmail: 'someone-else@example.com',
        });

        expect(result).toEqual({ outcome: OWNER_ALREADY_JOINED });

        const [row] = await db()
          .select()
          .from(tenants)
          .where(eq(tenants.id, tenantId));
        expect(row?.name).toBe('Acme');
      });
    });
    it('returns owner-already-joined and applies no changes at all when the invited owner has already signed in', async () => {
      await insertJoinedOwner(tenantId);

      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        name: 'New Name',
        ownerEmail: NEW_OWNER_EMAIL,
      });

      expect(result).toEqual({ outcome: OWNER_ALREADY_JOINED });

      const [row] = await db()
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));
      expect(row?.name).toBe('Acme');

      const inviteRows = await db()
        .select()
        .from(membershipInvites)
        .where(eq(membershipInvites.tenantId, tenantId));
      expect(inviteRows).toHaveLength(0);
    });
  });

  describe('a tenant with a RUNNING step', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenantWithDomain({
        provisioningSteps: {
          SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
          SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          VERIFY_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        },
      });
    });

    it('refuses with provisioning-started and leaves the row unchanged when a step is RUNNING', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        name: 'New Name',
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });

      const [row] = await db()
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));
      expect(row?.name).toBe('Acme');
    });
    it('returns provisioning-started for an ownerEmail edit after provisioning has started, and leaves the invite untouched', async () => {
      await insertOwnerInvite(tenantId, OWNER_EMAIL);

      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        ownerEmail: NEW_OWNER_EMAIL,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });

      const [invite] = await db()
        .select()
        .from(membershipInvites)
        .where(eq(membershipInvites.tenantId, tenantId));
      expect(invite?.email).toBe(OWNER_EMAIL);
    });
  });

  describe('with another tenant owning acme.example.com', () => {
    beforeEach(async () => {
      await insertTenantWithDomain({ domain: ACME_DOMAIN });
    });

    it('returns a handled domain-taken outcome instead of throwing on a domain collision', async () => {
      const secondTenantId = await insertTenantWithDomain({
        domain: GLOBEX_DOMAIN,
      });

      const result = await updateTenantDetails(secondTenantId, {
        ...validInput,
        primaryDomain: ACME_DOMAIN,
      });

      expect(result).toEqual({ outcome: DOMAIN_TAKEN });

      const [row] = await db()
        .select()
        .from(tenants)
        .where(eq(tenants.id, secondTenantId));
      expect(row).toMatchObject({
        name: 'Acme',
        primaryDomain: GLOBEX_DOMAIN,
        plan: TENANT_PLAN.FREE,
        locale: LOCALE_ISO_CODES.EN,
      });

      const domainRows = await db()
        .select()
        .from(tenantDomains)
        .where(eq(tenantDomains.tenantId, secondTenantId));
      expect(domainRows).toHaveLength(1);
      expect(domainRows[0]).toMatchObject({ domain: GLOBEX_DOMAIN });
    });
    it('returns provisioning-started over domain-taken when both apply', async () => {
      const secondTenantId = await insertTenantWithDomain({
        domain: GLOBEX_DOMAIN,
        provisioningSteps: {
          SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
          SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          VERIFY_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
          OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        },
      });

      const result = await updateTenantDetails(secondTenantId, {
        ...validInput,
        primaryDomain: ACME_DOMAIN,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });
    });
  });

  describe('a FAILED tenant whose MAP_DOMAIN step has completed', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenantWithDomain({
        domain: ACME_DOMAIN,
        provisioningSteps: stepsWith({
          SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
          SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
          PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
          MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
          CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
        }),
      });
    });

    it('refuses a changed primaryDomain with domain-locked once MAP_DOMAIN has completed, and leaves the row unchanged', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        primaryDomain: ACME_NEW_DOMAIN,
      });

      expect(result).toEqual({
        outcome: DOMAIN_LOCKED,
        blockingStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      });

      const [row] = await db()
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));
      expect(row?.primaryDomain).toBe(ACME_DOMAIN);
    });
    it('applies the rest of the update instead of domain-locked when the resubmitted primaryDomain is unchanged, even though MAP_DOMAIN has completed', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        primaryDomain: ACME_DOMAIN,
        name: 'New Name',
      });

      expect(result).toMatchObject({
        outcome: 'updated',
        tenant: { name: 'New Name', primaryDomain: ACME_DOMAIN },
      });
    });
    it('keeps name, plan and locale editable on a FAILED tenant even once every earlier step has completed', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        primaryDomain: ACME_DOMAIN,
        name: 'New Name',
        plan: TENANT_PLAN.GROWTH,
        locale: LOCALE_ISO_CODES.FR,
      });

      expect(result).toMatchObject({
        outcome: 'updated',
        tenant: {
          name: 'New Name',
          plan: TENANT_PLAN.GROWTH,
          locale: LOCALE_ISO_CODES.FR,
        },
      });
    });
  });

  it('returns a handled domain-taken outcome (not a throw) when renaming onto a secondary domain the same tenant already owns', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: ACME_DOMAIN,
    });
    await db()
      .insert(tenantDomains)
      .values({ tenantId, domain: ACME_ALT_DOMAIN });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: ACME_ALT_DOMAIN,
    });

    expect(result).toEqual({ outcome: DOMAIN_TAKEN });

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row).toMatchObject({
      name: 'Acme',
      primaryDomain: ACME_DOMAIN,
      plan: TENANT_PLAN.FREE,
      locale: LOCALE_ISO_CODES.EN,
    });

    const domainRows = await db()
      .select()
      .from(tenantDomains)
      .where(eq(tenantDomains.tenantId, tenantId));
    expect(domainRows).toHaveLength(2);
    expect(domainRows.map((r) => r.domain).sort()).toEqual([
      ACME_ALT_DOMAIN,
      ACME_DOMAIN,
    ]);
  });

  it("still updates when the domain is unchanged and only the tenant's own tenant_domains row holds it", async () => {
    const tenantId = await insertTenantWithDomain({
      domain: ACME_DOMAIN,
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: ACME_DOMAIN,
      name: 'New Name',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name', primaryDomain: ACME_DOMAIN },
    });
  });

  it('leaves provisioning artifact columns untouched by an update', async () => {
    const tenantId = await insertTenantWithDomain({
      sanityProjectId: 'abc123',
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    if (result.outcome !== 'updated') {
      throw new Error(`expected 'updated', got '${result.outcome}'`);
    }
    expect(result.tenant).toMatchObject({
      sanityProjectId: 'abc123',
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      status: TENANT_STATUS.ACTIVE,
    });
  });

  it('refuses with provisioning-started when a step is DONE', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        VERIFY_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(tenantId, validInput);

    expect(result).toEqual({ outcome: PROVISIONING_STARTED });
  });

  it('refuses with provisioning-started when provisioningStatus is PROVISIONING even though every step is still IDLE', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: stepsWith({}),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toEqual({ outcome: PROVISIONING_STARTED });

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.name).toBe('Acme');
  });

  it('still updates when every step is IDLE', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        VERIFY_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name' },
    });
  });

  it('refuses with provisioning-started when every step has succeeded', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toEqual({ outcome: PROVISIONING_STARTED });

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.name).toBe('Acme');
  });

  it('refuses with provisioning-started when every core step has succeeded, even though OWNER_ELEVATION is FAILED', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toEqual({ outcome: PROVISIONING_STARTED });

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.name).toBe('Acme');
  });

  it('updates a changed primaryDomain when provisioning failed before MAP_DOMAIN completed', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: ACME_DOMAIN,
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: ACME_FIXED_DOMAIN,
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { primaryDomain: ACME_FIXED_DOMAIN },
    });
  });

  it('keeps locale editable on a FAILED tenant even though SEED_CONTENT has completed', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      locale: LOCALE_ISO_CODES.FR,
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { locale: LOCALE_ISO_CODES.FR },
    });
  });

  it('keeps name editable on a FAILED tenant even though SANITY_PROJECT (which used it as the Sanity project display name) has completed', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name' },
    });
  });

  it('keeps primaryDomain editable when MAP_DOMAIN is FAILED even though a later-indexed step (CREATE_WEBHOOK) is stale-DONE from a prior run', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: ACME_DOMAIN,
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: ACME_FIXED_DOMAIN,
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { primaryDomain: ACME_FIXED_DOMAIN },
    });
  });

  it('still locks primaryDomain via a stale-DONE MAP_DOMAIN even though an earlier-indexed step (PERSIST_TOKEN) is FAILED', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: ACME_DOMAIN,
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: ACME_NEW_DOMAIN,
    });

    expect(result).toEqual({
      outcome: DOMAIN_LOCKED,
      blockingStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    });
  });

  it('throws for a tenant id that does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await expect(updateTenantDetails(missingId, validInput)).rejects.toThrow(
      `updateTenantDetails: no tenant found for id "${missingId}".`,
    );
  });

  it.each([
    ['a scheme-prefixed value', 'https://acme-new.com'],
    ['a trailing-slash value', 'acme-new.com/'],
    ['a whitespace-padded value', ' acme-new.com '],
  ])(
    'returns domain-invalid for %s primaryDomain and applies no changes',
    async (_description, primaryDomain) => {
      const tenantId = await insertTenantWithDomain();

      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        name: 'New Name',
        primaryDomain,
      });

      expect(result).toEqual({ outcome: 'domain-invalid' });

      const [row] = await db()
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));
      expect(row).toMatchObject({
        name: 'Acme',
        primaryDomain: ACME_DOMAIN,
      });

      const domainRows = await db()
        .select()
        .from(tenantDomains)
        .where(eq(tenantDomains.tenantId, tenantId));
      expect(domainRows).toHaveLength(1);
      expect(domainRows[0]).toMatchObject({ domain: ACME_DOMAIN });
    },
  );

  it('refuses a move to FREE that would give a person a second Free site', async () => {
    const selfServeOwnerEmailIndex = testPersonalEmailIndex(
      SELF_SERVE_OWNER_EMAIL,
    );
    const tenantId = await insertTenantWithDomain();
    await db()
      .update(tenants)
      .set({ plan: TENANT_PLAN.GROWTH, selfServeOwnerEmailIndex })
      .where(eq(tenants.id, tenantId));
    await insertTestTenant(db(), { selfServeOwnerEmailIndex });
    const [before] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
      plan: TENANT_PLAN.FREE,
    });

    expect(result).toEqual({ outcome: OWNS_FREE_TENANT_OUTCOME });
    const [after] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(after).toEqual(before);
  });
});
