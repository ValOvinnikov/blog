import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
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
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { and, eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import {
  updateTenantDetails,
  type TUpdateTenantDetailsInput,
} from './update-tenant-details';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

const validInput: TUpdateTenantDetailsInput = {
  name: 'Acme Updated',
  primaryDomain: 'acme.example.com',
  plan: TENANT_PLAN.FREE,
  locale: 'en',
};

async function insertTenantWithDomain(overrides?: {
  domain?: string;
  sanityProjectId?: string;
  provisioningStatus?: (typeof TENANT_PROVISIONING_STATUS)[keyof typeof TENANT_PROVISIONING_STATUS];
  provisioningSteps?: TTenantProvisioningState;
}): Promise<string> {
  const domain = overrides?.domain ?? 'acme.example.com';

  const tenant = await insertTestTenant(db, {
    name: 'Acme',
    primaryDomain: domain,
    sanityProjectId: overrides?.sanityProjectId,
    provisioningStatus: overrides?.provisioningStatus,
    provisioningSteps: overrides?.provisioningSteps,
  });

  await db.insert(tenantDomains).values({ tenantId: tenant.id, domain });

  return tenant.id;
}

async function insertOwnerInvite(
  tenantId: string,
  email: string,
): Promise<string> {
  const [invite] = await db
    .insert(membershipInvites)
    .values({ tenantId, email, role: MEMBERSHIP_ROLE.OWNER })
    .returning();

  if (!invite)
    throw new Error('setup: membership invite insert returned no row.');

  return invite.id;
}

async function insertJoinedOwner(
  tenantId: string,
  email?: string,
): Promise<void> {
  const [user] = await db.insert(users).values({ email }).returning();
  if (!user) throw new Error('setup: user insert returned no row.');

  await db
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
    OWNER_ELEVATION: idle,
    ...overrides,
  };
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenantDomains);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

describe(updateTenantDetails, () => {
  it('updates the editable fields and returns the updated row', async () => {
    const tenantId = await insertTenantWithDomain();

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
      locale: 'fr',
      plan: TENANT_PLAN.GROWTH,
    });

    if (result.outcome !== 'updated') {
      throw new Error(`expected 'updated', got '${result.outcome}'`);
    }
    expect(result.tenant).toMatchObject({
      name: 'New Name',
      locale: 'fr',
      plan: TENANT_PLAN.GROWTH,
    });
  });

  it('updates primaryDomain and moves the matching tenant_domains row with it', async () => {
    const tenantId = await insertTenantWithDomain();

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: 'acme-new.example.com',
    });

    if (result.outcome !== 'updated') {
      throw new Error(`expected 'updated', got '${result.outcome}'`);
    }
    expect(result.tenant.primaryDomain).toBe('acme-new.example.com');

    const domainRows = await db
      .select()
      .from(tenantDomains)
      .where(eq(tenantDomains.tenantId, tenantId));

    expect(domainRows).toHaveLength(1);
    expect(domainRows[0]).toMatchObject({ domain: 'acme-new.example.com' });
  });

  it('returns a handled domain-taken outcome instead of throwing on a domain collision', async () => {
    await insertTenantWithDomain({ domain: 'acme.example.com' });
    const secondTenantId = await insertTenantWithDomain({
      domain: 'globex.example.com',
    });

    const result = await updateTenantDetails(secondTenantId, {
      ...validInput,
      primaryDomain: 'acme.example.com',
    });

    expect(result).toEqual({ outcome: 'domain-taken' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, secondTenantId));
    expect(row).toMatchObject({
      name: 'Acme',
      primaryDomain: 'globex.example.com',
      plan: TENANT_PLAN.FREE,
      locale: 'en',
    });

    const domainRows = await db
      .select()
      .from(tenantDomains)
      .where(eq(tenantDomains.tenantId, secondTenantId));
    expect(domainRows).toHaveLength(1);
    expect(domainRows[0]).toMatchObject({ domain: 'globex.example.com' });
  });

  it('returns a handled domain-taken outcome (not a throw) when renaming onto a secondary domain the same tenant already owns', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: 'acme.example.com',
    });
    // The pre-check doesn't exclude the tenant's own tenant_domains rows, so
    // this collides the same way a cross-tenant one would.
    await db
      .insert(tenantDomains)
      .values({ tenantId, domain: 'acme-alt.example.com' });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: 'acme-alt.example.com',
    });

    expect(result).toEqual({ outcome: 'domain-taken' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row).toMatchObject({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      plan: TENANT_PLAN.FREE,
      locale: 'en',
    });

    const domainRows = await db
      .select()
      .from(tenantDomains)
      .where(eq(tenantDomains.tenantId, tenantId));
    expect(domainRows).toHaveLength(2);
    expect(domainRows.map((r) => r.domain).sort()).toEqual([
      'acme-alt.example.com',
      'acme.example.com',
    ]);
  });

  it("still updates when the domain is unchanged and only the tenant's own tenant_domains row holds it", async () => {
    const tenantId = await insertTenantWithDomain({
      domain: 'acme.example.com',
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: 'acme.example.com',
      name: 'New Name',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name', primaryDomain: 'acme.example.com' },
    });
  });

  it('returns provisioning-started over domain-taken when both apply', async () => {
    await insertTenantWithDomain({ domain: 'acme.example.com' });
    const secondTenantId = await insertTenantWithDomain({
      domain: 'globex.example.com',
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(secondTenantId, {
      ...validInput,
      primaryDomain: 'acme.example.com',
    });

    expect(result).toEqual({ outcome: 'provisioning-started' });
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

  it('refuses with provisioning-started and leaves the row unchanged when a step is RUNNING', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toEqual({ outcome: 'provisioning-started' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.name).toBe('Acme');
  });

  it('refuses with provisioning-started when a step is DONE', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(tenantId, validInput);

    expect(result).toEqual({ outcome: 'provisioning-started' });
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

    expect(result).toEqual({ outcome: 'provisioning-started' });

    const [row] = await db
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

  it('still updates when provisioningSteps is null', async () => {
    const tenantId = await insertTenantWithDomain();

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

    expect(result).toEqual({ outcome: 'provisioning-started' });

    const [row] = await db
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

    expect(result).toEqual({ outcome: 'provisioning-started' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.name).toBe('Acme');
  });

  it('updates a changed primaryDomain when provisioning failed before MAP_DOMAIN completed', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: 'acme.example.com',
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: 'acme-fixed.example.com',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { primaryDomain: 'acme-fixed.example.com' },
    });
  });

  it('refuses a changed primaryDomain with domain-locked once MAP_DOMAIN has completed, and leaves the row unchanged', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: 'acme.example.com',
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: 'acme-new.example.com',
    });

    expect(result).toEqual({
      outcome: 'domain-locked',
      blockingStep: 'MAP_DOMAIN',
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.primaryDomain).toBe('acme.example.com');
  });

  it('applies the rest of the update instead of domain-locked when the resubmitted primaryDomain is unchanged, even though MAP_DOMAIN has completed', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: 'acme.example.com',
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: 'acme.example.com',
      name: 'New Name',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name', primaryDomain: 'acme.example.com' },
    });
  });

  it('keeps name, plan and locale editable on a FAILED tenant even once every earlier step has completed', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: 'acme.example.com',
      provisioningSteps: stepsWith({
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.FAILED },
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: 'acme.example.com',
      name: 'New Name',
      plan: TENANT_PLAN.GROWTH,
      locale: 'fr',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name', plan: TENANT_PLAN.GROWTH, locale: 'fr' },
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
      locale: 'fr',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { locale: 'fr' },
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
      domain: 'acme.example.com',
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
      primaryDomain: 'acme-fixed.example.com',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { primaryDomain: 'acme-fixed.example.com' },
    });
  });

  it('still locks primaryDomain via a stale-DONE MAP_DOMAIN even though an earlier-indexed step (PERSIST_TOKEN) is FAILED', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: 'acme.example.com',
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
      primaryDomain: 'acme-new.example.com',
    });

    expect(result).toEqual({
      outcome: 'domain-locked',
      blockingStep: 'MAP_DOMAIN',
    });
  });

  it('throws for a tenant id that does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await expect(updateTenantDetails(missingId, validInput)).rejects.toThrow(
      `updateTenantDetails: no tenant found for id "${missingId}".`,
    );
  });

  it('updates the pending owner invite email, normalized, when ownerEmail is supplied', async () => {
    const tenantId = await insertTenantWithDomain();
    await insertOwnerInvite(tenantId, 'owner@example.com');

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      ownerEmail: '  New-Owner@Example.com  ',
    });

    expect(result).toMatchObject({ outcome: 'updated' });

    const [invite] = await db
      .select()
      .from(membershipInvites)
      .where(eq(membershipInvites.tenantId, tenantId));
    expect(invite?.email).toBe('new-owner@example.com');
  });

  it('leaves the pending owner invite untouched when ownerEmail is omitted', async () => {
    const tenantId = await insertTenantWithDomain();
    await insertOwnerInvite(tenantId, 'owner@example.com');

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toMatchObject({ outcome: 'updated' });

    const [invite] = await db
      .select()
      .from(membershipInvites)
      .where(eq(membershipInvites.tenantId, tenantId));
    expect(invite?.email).toBe('owner@example.com');
  });

  it('returns provisioning-started for an ownerEmail edit after provisioning has started, and leaves the invite untouched', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });
    await insertOwnerInvite(tenantId, 'owner@example.com');

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      ownerEmail: 'new-owner@example.com',
    });

    expect(result).toEqual({ outcome: 'provisioning-started' });

    const [invite] = await db
      .select()
      .from(membershipInvites)
      .where(eq(membershipInvites.tenantId, tenantId));
    expect(invite?.email).toBe('owner@example.com');
  });

  it('returns owner-already-joined and applies no changes at all when the invited owner has already signed in', async () => {
    const tenantId = await insertTenantWithDomain();
    await insertJoinedOwner(tenantId);

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
      ownerEmail: 'new-owner@example.com',
    });

    expect(result).toEqual({ outcome: 'owner-already-joined' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.name).toBe('Acme');

    const inviteRows = await db
      .select()
      .from(membershipInvites)
      .where(eq(membershipInvites.tenantId, tenantId));
    expect(inviteRows).toHaveLength(0);
  });

  it('returns owner-email-taken and leaves the invite untouched when the new email collides with another invite on the tenant', async () => {
    const tenantId = await insertTenantWithDomain();
    await insertOwnerInvite(tenantId, 'owner@example.com');
    await db.insert(membershipInvites).values({
      tenantId,
      email: 'member@example.com',
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      ownerEmail: 'member@example.com',
    });

    expect(result).toEqual({ outcome: 'owner-email-taken' });

    const [ownerInvite] = await db
      .select()
      .from(membershipInvites)
      .where(
        and(
          eq(membershipInvites.tenantId, tenantId),
          eq(membershipInvites.role, MEMBERSHIP_ROLE.OWNER),
        ),
      );
    expect(ownerInvite?.email).toBe('owner@example.com');
  });

  it("applies the rest of the update instead of returning owner-already-joined when ownerEmail resubmits the joined owner's unchanged email", async () => {
    const tenantId = await insertTenantWithDomain();
    await insertJoinedOwner(tenantId, 'owner@example.com');

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
      ownerEmail: 'owner@example.com',
    });

    if (result.outcome !== 'updated') {
      throw new Error(`expected 'updated', got '${result.outcome}'`);
    }
    expect(result.tenant.name).toBe('New Name');
  });

  it("treats a case/whitespace-only difference from the joined owner's email as unchanged and applies the update", async () => {
    const tenantId = await insertTenantWithDomain();
    await insertJoinedOwner(tenantId, 'owner@example.com');

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

  it('leaves the pending invite untouched when ownerEmail resubmits its unchanged email', async () => {
    const tenantId = await insertTenantWithDomain();
    await insertOwnerInvite(tenantId, 'owner@example.com');

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
      ownerEmail: 'owner@example.com',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name' },
    });

    const [invite] = await db
      .select()
      .from(membershipInvites)
      .where(eq(membershipInvites.tenantId, tenantId));
    expect(invite?.email).toBe('owner@example.com');
  });

  it("still returns owner-already-joined and applies no changes when ownerEmail differs from the joined owner's email", async () => {
    const tenantId = await insertTenantWithDomain();
    await insertJoinedOwner(tenantId, 'owner@example.com');

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
      ownerEmail: 'someone-else@example.com',
    });

    expect(result).toEqual({ outcome: 'owner-already-joined' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.name).toBe('Acme');
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

      const [row] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));
      expect(row).toMatchObject({
        name: 'Acme',
        primaryDomain: 'acme.example.com',
      });

      const domainRows = await db
        .select()
        .from(tenantDomains)
        .where(eq(tenantDomains.tenantId, tenantId));
      expect(domainRows).toHaveLength(1);
      expect(domainRows[0]).toMatchObject({ domain: 'acme.example.com' });
    },
  );
});
