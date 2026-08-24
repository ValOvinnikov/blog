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
  type TTenantProvisioningSteps,
} from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
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
  slug: 'acme',
  primaryDomain: 'acme.example.com',
  plan: TENANT_PLAN.FREE,
  locale: 'en',
};

async function insertTenantWithDomain(overrides?: {
  slug?: string;
  domain?: string;
  sanityProjectId?: string;
  provisioningStatus?: (typeof TENANT_PROVISIONING_STATUS)[keyof typeof TENANT_PROVISIONING_STATUS];
  provisioningSteps?: TTenantProvisioningSteps;
}): Promise<string> {
  const slug = overrides?.slug ?? 'acme';
  const domain = overrides?.domain ?? 'acme.example.com';

  const [tenant] = await db
    .insert(tenants)
    .values({
      slug,
      name: 'Acme',
      primaryDomain: domain,
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      sanityProjectId: overrides?.sanityProjectId,
      provisioningStatus: overrides?.provisioningStatus,
      provisioningSteps: overrides?.provisioningSteps,
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

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

  it('returns a handled slug-taken outcome instead of throwing on a slug collision', async () => {
    await insertTenantWithDomain({
      slug: 'acme',
      domain: 'acme.example.com',
    });
    const secondTenantId = await insertTenantWithDomain({
      slug: 'globex',
      domain: 'globex.example.com',
    });

    const result = await updateTenantDetails(secondTenantId, {
      ...validInput,
      slug: 'acme',
      primaryDomain: 'globex.example.com',
    });

    expect(result).toEqual({ outcome: 'slug-taken' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, secondTenantId));
    expect(row?.slug).toBe('globex');
  });

  it('returns a handled domain-taken outcome instead of throwing on a domain collision', async () => {
    await insertTenantWithDomain({
      slug: 'acme',
      domain: 'acme.example.com',
    });
    const secondTenantId = await insertTenantWithDomain({
      slug: 'globex',
      domain: 'globex.example.com',
    });

    const result = await updateTenantDetails(secondTenantId, {
      ...validInput,
      slug: 'globex',
      primaryDomain: 'acme.example.com',
    });

    expect(result).toEqual({ outcome: 'domain-taken' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, secondTenantId));
    expect(row).toMatchObject({
      name: 'Acme',
      slug: 'globex',
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

  it("still updates when the domain is unchanged and only the tenant's own tenant_domains row holds it", async () => {
    const tenantId = await insertTenantWithDomain({
      slug: 'acme',
      domain: 'acme.example.com',
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      slug: 'acme',
      primaryDomain: 'acme.example.com',
      name: 'New Name',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name', primaryDomain: 'acme.example.com' },
    });
  });

  it('returns provisioning-started over domain-taken when both apply', async () => {
    await insertTenantWithDomain({
      slug: 'acme',
      domain: 'acme.example.com',
    });
    const secondTenantId = await insertTenantWithDomain({
      slug: 'globex',
      domain: 'globex.example.com',
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        DEPLOY_STUDIO: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(secondTenantId, {
      ...validInput,
      slug: 'globex',
      primaryDomain: 'acme.example.com',
    });

    expect(result).toEqual({ outcome: 'provisioning-started' });
  });

  it('returns slug-taken over domain-taken when both apply', async () => {
    await insertTenantWithDomain({
      slug: 'acme',
      domain: 'acme.example.com',
    });
    const secondTenantId = await insertTenantWithDomain({
      slug: 'globex',
      domain: 'globex.example.com',
    });

    const result = await updateTenantDetails(secondTenantId, {
      ...validInput,
      slug: 'acme',
      primaryDomain: 'acme.example.com',
    });

    expect(result).toEqual({ outcome: 'slug-taken' });
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
        DEPLOY_STUDIO: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
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
        DEPLOY_STUDIO: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(tenantId, validInput);

    expect(result).toEqual({ outcome: 'provisioning-started' });
  });

  it('still updates when every step is IDLE', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        DEPLOY_STUDIO: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
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
        DEPLOY_STUDIO: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
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
});
