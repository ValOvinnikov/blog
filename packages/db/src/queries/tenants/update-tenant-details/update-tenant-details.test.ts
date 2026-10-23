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
  type TTenant,
  type TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { MOCK_OWNER_EMAIL, insertTestTenant } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { SELF_SERVE_OWNER_EMAIL } from '@blog/db/testing/tenants/self-serve-fixtures';
import { MOCK_SANITY_PROJECT_ID } from '@blog/db/testing/sanity-management-client/fixtures';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
  MOCK_TENANT_DOMAIN,
} from '@blog/db/testing/tenants/fixtures';
import { encryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { and, eq } from 'drizzle-orm';

import {
  OWNS_FREE_TENANT_OUTCOME,
  updateTenantDetails,
  type TUpdateTenantDetailsInput,
  type TUpdateTenantDetailsResult,
} from './update-tenant-details';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const TENANT_NAME = 'Acme';
const NEW_NAME = 'New Name';
const ACME_NEW_DOMAIN = 'acme-new.example.com';
const ACME_ALT_DOMAIN = 'acme-alt.example.com';
const ACME_FIXED_DOMAIN = 'acme-fixed.example.com';
const GLOBEX_DOMAIN = 'globex.example.com';
const NEW_OWNER_EMAIL = 'new-owner@example.com';
const UNNORMALIZED_NEW_OWNER_EMAIL = '  New-Owner@Example.com  ';
const MEMBER_EMAIL = 'member@example.com';
const OWNER_ALREADY_JOINED = 'owner-already-joined';
const PROVISIONING_STARTED = 'provisioning-started';
const DOMAIN_TAKEN = 'domain-taken';
const DOMAIN_LOCKED = 'domain-locked';
const UPDATED = 'updated';
usePersonalDataKeys();

const { RUNNING, DONE, FAILED } = TENANT_PROVISIONING_STEP_STATUS;
const RUNNING_STEP = { status: RUNNING };
const DONE_STEP = { status: DONE };
const FAILED_STEP = { status: FAILED };

const EARLY_STEPS_DONE = {
  [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: DONE_STEP,
  [TENANT_PROVISIONING_STEP.SEED_CONTENT]: DONE_STEP,
  [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: DONE_STEP,
};

const ORIGINAL_DETAILS = {
  name: TENANT_NAME,
  primaryDomain: MOCK_TENANT_DOMAIN,
  plan: TENANT_PLAN.FREE,
  locale: LOCALE_ISO_CODES.EN,
};

const validInput: TUpdateTenantDetailsInput = {
  name: 'Acme Updated',
  primaryDomain: MOCK_TENANT_DOMAIN,
  plan: TENANT_PLAN.FREE,
  locale: LOCALE_ISO_CODES.EN,
};

function stepsWith(
  overrides: Partial<TTenantProvisioningState>,
): TTenantProvisioningState {
  return { ...MOCK_IDLE_PROVISIONING_STEPS, ...overrides };
}

async function insertTenantWithDomain(overrides?: {
  domain?: string;
  sanityProjectId?: string;
  provisioningStatus?: TTenantProvisioningStatus;
  provisioningSteps?: TTenantProvisioningState;
}): Promise<string> {
  const domain = overrides?.domain ?? MOCK_TENANT_DOMAIN;

  const tenant = await insertTestTenant(db(), {
    name: TENANT_NAME,
    primaryDomain: domain,
    sanityProjectId: overrides?.sanityProjectId,
    provisioningStatus: overrides?.provisioningStatus,
    provisioningSteps: overrides?.provisioningSteps,
  });

  await db().insert(tenantDomains).values({ tenantId: tenant.id, domain });

  return tenant.id;
}

async function insertOwnerInvite(tenantId: string, email: string) {
  await db()
    .insert(membershipInvites)
    .values({
      tenantId,
      email,
      emailEncrypted: encryptPersonalValue(email),
      role: MEMBERSHIP_ROLE.OWNER,
    });
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

function unwrapUpdated(result: TUpdateTenantDetailsResult): TTenant {
  if (result.outcome !== UPDATED) {
    throw new Error(`expected '${UPDATED}', got '${result.outcome}'`);
  }
  return result.tenant;
}

async function readDetails(tenantId: string) {
  const [row] = await db()
    .select({
      name: tenants.name,
      primaryDomain: tenants.primaryDomain,
      plan: tenants.plan,
      locale: tenants.locale,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return row;
}

async function readDomains(tenantId: string): Promise<string[]> {
  const rows = await db()
    .select({ domain: tenantDomains.domain })
    .from(tenantDomains)
    .where(eq(tenantDomains.tenantId, tenantId));
  return rows.map(({ domain }) => domain).sort();
}

async function readOwnerInvite(tenantId: string) {
  const [invite] = await db()
    .select()
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        eq(membershipInvites.role, MEMBERSHIP_ROLE.OWNER),
      ),
    );
  return invite;
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
      const { name, locale, plan } = unwrapUpdated(
        await updateTenantDetails(tenantId, {
          ...validInput,
          name: NEW_NAME,
          locale: LOCALE_ISO_CODES.FR,
          plan: TENANT_PLAN.GROWTH,
        }),
      );

      expect(name).toBe(NEW_NAME);
      expect(locale).toBe(LOCALE_ISO_CODES.FR);
      expect(plan).toBe(TENANT_PLAN.GROWTH);
    });

    it('updates primaryDomain and moves the matching tenant_domains row with it', async () => {
      const { primaryDomain } = unwrapUpdated(
        await updateTenantDetails(tenantId, {
          ...validInput,
          primaryDomain: ACME_NEW_DOMAIN,
        }),
      );

      expect(primaryDomain).toBe(ACME_NEW_DOMAIN);
      expect(await readDomains(tenantId)).toEqual([ACME_NEW_DOMAIN]);
    });

    describe('with a pending owner invite', () => {
      beforeEach(async () => {
        await insertOwnerInvite(tenantId, MOCK_OWNER_EMAIL);
      });

      it('rewrites the pending owner invite to the normalized new address', async () => {
        unwrapUpdated(
          await updateTenantDetails(tenantId, {
            ...validInput,
            ownerEmail: UNNORMALIZED_NEW_OWNER_EMAIL,
          }),
        );

        const invite = await readOwnerInvite(tenantId);
        expect(invite?.email).toBe(NEW_OWNER_EMAIL);
        expect(invite?.emailIndex).toBe(
          testPersonalEmailIndex(NEW_OWNER_EMAIL),
        );
        expect(decryptTestPersonalValue(invite?.emailEncrypted ?? null)).toBe(
          NEW_OWNER_EMAIL,
        );
      });

      it.each([
        ['omitted', undefined],
        ['resubmitted unchanged', MOCK_OWNER_EMAIL],
      ])(
        'applies the update and leaves the invite alone when ownerEmail is %s',
        async (_description, ownerEmail) => {
          const { name } = unwrapUpdated(
            await updateTenantDetails(tenantId, {
              ...validInput,
              name: NEW_NAME,
              ownerEmail,
            }),
          );

          expect(name).toBe(NEW_NAME);
          expect((await readOwnerInvite(tenantId))?.email).toBe(
            MOCK_OWNER_EMAIL,
          );
        },
      );

      it('returns owner-email-taken when the new email matches another invite', async () => {
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
        expect((await readOwnerInvite(tenantId))?.email).toBe(MOCK_OWNER_EMAIL);
      });
    });

    describe('with a joined owner who has an email', () => {
      beforeEach(async () => {
        await insertJoinedOwner(tenantId, MOCK_OWNER_EMAIL);
      });

      it.each([MOCK_OWNER_EMAIL, `  ${MOCK_OWNER_EMAIL.toUpperCase()}  `])(
        "applies the update when ownerEmail resubmits the joined owner's %j",
        async (ownerEmail) => {
          const { name } = unwrapUpdated(
            await updateTenantDetails(tenantId, {
              ...validInput,
              name: NEW_NAME,
              ownerEmail,
            }),
          );

          expect(name).toBe(NEW_NAME);
        },
      );

      it("returns owner-already-joined when ownerEmail differs from the owner's", async () => {
        const result = await updateTenantDetails(tenantId, {
          ...validInput,
          name: NEW_NAME,
          ownerEmail: 'someone-else@example.com',
        });

        expect(result).toEqual({ outcome: OWNER_ALREADY_JOINED });
        expect((await readDetails(tenantId))?.name).toBe(TENANT_NAME);
      });
    });

    it('returns owner-already-joined and changes nothing once the owner signed in', async () => {
      await insertJoinedOwner(tenantId);

      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        name: NEW_NAME,
        ownerEmail: NEW_OWNER_EMAIL,
      });

      expect(result).toEqual({ outcome: OWNER_ALREADY_JOINED });
      expect((await readDetails(tenantId))?.name).toBe(TENANT_NAME);
      expect(await readOwnerInvite(tenantId)).toBeUndefined();
    });

    it('returns domain-taken when renaming onto its own secondary domain', async () => {
      await db()
        .insert(tenantDomains)
        .values({ tenantId, domain: ACME_ALT_DOMAIN });

      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        primaryDomain: ACME_ALT_DOMAIN,
      });

      expect(result).toEqual({ outcome: DOMAIN_TAKEN });
      expect(await readDetails(tenantId)).toEqual(ORIGINAL_DETAILS);
      expect(await readDomains(tenantId)).toEqual(
        [ACME_ALT_DOMAIN, MOCK_TENANT_DOMAIN].sort(),
      );
    });

    it.each([
      ['a scheme-prefixed value', 'https://acme-new.com'],
      ['a trailing-slash value', 'acme-new.com/'],
      ['a whitespace-padded value', ' acme-new.com '],
    ])(
      'returns domain-invalid for %s primaryDomain and applies no changes',
      async (_description, primaryDomain) => {
        const result = await updateTenantDetails(tenantId, {
          ...validInput,
          name: NEW_NAME,
          primaryDomain,
        });

        expect(result).toEqual({ outcome: 'domain-invalid' });
        expect(await readDetails(tenantId)).toEqual(ORIGINAL_DETAILS);
        expect(await readDomains(tenantId)).toEqual([MOCK_TENANT_DOMAIN]);
      },
    );
  });

  describe('a tenant with a RUNNING step', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenantWithDomain({
        provisioningSteps: stepsWith({
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: RUNNING_STEP,
        }),
      });
    });

    it('refuses with provisioning-started and leaves the row unchanged', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        name: NEW_NAME,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });
      expect((await readDetails(tenantId))?.name).toBe(TENANT_NAME);
    });

    it('refuses an ownerEmail edit with provisioning-started, leaving the invite', async () => {
      await insertOwnerInvite(tenantId, MOCK_OWNER_EMAIL);

      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        ownerEmail: NEW_OWNER_EMAIL,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });
      expect((await readOwnerInvite(tenantId))?.email).toBe(MOCK_OWNER_EMAIL);
    });
  });

  describe('with another tenant owning the default domain', () => {
    beforeEach(async () => {
      await insertTenantWithDomain({ domain: MOCK_TENANT_DOMAIN });
    });

    it('returns domain-taken instead of throwing on a domain collision', async () => {
      const secondTenantId = await insertTenantWithDomain({
        domain: GLOBEX_DOMAIN,
      });

      const result = await updateTenantDetails(secondTenantId, {
        ...validInput,
        primaryDomain: MOCK_TENANT_DOMAIN,
      });

      expect(result).toEqual({ outcome: DOMAIN_TAKEN });
      expect(await readDetails(secondTenantId)).toEqual({
        ...ORIGINAL_DETAILS,
        primaryDomain: GLOBEX_DOMAIN,
      });
      expect(await readDomains(secondTenantId)).toEqual([GLOBEX_DOMAIN]);
    });

    it('returns provisioning-started over domain-taken when both apply', async () => {
      const secondTenantId = await insertTenantWithDomain({
        domain: GLOBEX_DOMAIN,
        provisioningSteps: stepsWith({
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: RUNNING_STEP,
        }),
      });

      const result = await updateTenantDetails(secondTenantId, {
        ...validInput,
        primaryDomain: MOCK_TENANT_DOMAIN,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });
    });
  });

  describe('a FAILED tenant whose MAP_DOMAIN step has completed', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenantWithDomain({
        domain: MOCK_TENANT_DOMAIN,
        provisioningSteps: stepsWith({
          ...EARLY_STEPS_DONE,
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: DONE_STEP,
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: FAILED_STEP,
        }),
      });
    });

    it('refuses a changed primaryDomain with domain-locked, leaving the row', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        primaryDomain: ACME_NEW_DOMAIN,
      });

      expect(result).toEqual({
        outcome: DOMAIN_LOCKED,
        blockingStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      });
      expect((await readDetails(tenantId))?.primaryDomain).toBe(
        MOCK_TENANT_DOMAIN,
      );
    });

    it('keeps name, plan and locale editable when primaryDomain is unchanged', async () => {
      const { name, plan, locale, primaryDomain } = unwrapUpdated(
        await updateTenantDetails(tenantId, {
          ...validInput,
          primaryDomain: MOCK_TENANT_DOMAIN,
          name: NEW_NAME,
          plan: TENANT_PLAN.GROWTH,
          locale: LOCALE_ISO_CODES.FR,
        }),
      );

      expect(name).toBe(NEW_NAME);
      expect(plan).toBe(TENANT_PLAN.GROWTH);
      expect(locale).toBe(LOCALE_ISO_CODES.FR);
      expect(primaryDomain).toBe(MOCK_TENANT_DOMAIN);
    });
  });

  it('leaves provisioning artifact columns untouched by an update', async () => {
    const tenantId = await insertTenantWithDomain({
      sanityProjectId: MOCK_SANITY_PROJECT_ID,
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    const { sanityProjectId, provisioningStatus, status } = unwrapUpdated(
      await updateTenantDetails(tenantId, { ...validInput, name: NEW_NAME }),
    );

    expect(sanityProjectId).toBe(MOCK_SANITY_PROJECT_ID);
    expect(provisioningStatus).toBe(TENANT_PROVISIONING_STATUS.READY);
    expect(status).toBe(TENANT_STATUS.ACTIVE);
  });

  it.each([
    [
      'a step is DONE',
      {
        provisioningSteps: stepsWith({
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: DONE_STEP,
        }),
      },
    ],
    [
      'provisioningStatus is PROVISIONING with every step IDLE',
      {
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: MOCK_IDLE_PROVISIONING_STEPS,
      },
    ],
    [
      'every core step has succeeded',
      {
        provisioningSteps: stepsWith({
          ...EARLY_STEPS_DONE,
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: DONE_STEP,
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: DONE_STEP,
        }),
      },
    ],
    [
      'every core step has succeeded and OWNER_ELEVATION is FAILED',
      {
        provisioningSteps: stepsWith({
          ...EARLY_STEPS_DONE,
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: DONE_STEP,
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: DONE_STEP,
          [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: FAILED_STEP,
        }),
      },
    ],
  ])(
    'refuses with provisioning-started when %s',
    async (_description, provisioning) => {
      const tenantId = await insertTenantWithDomain(provisioning);

      const result = await updateTenantDetails(tenantId, {
        ...validInput,
        name: NEW_NAME,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });
      expect((await readDetails(tenantId))?.name).toBe(TENANT_NAME);
    },
  );

  it('still updates when every step is IDLE', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: MOCK_IDLE_PROVISIONING_STEPS,
    });

    const { name } = unwrapUpdated(
      await updateTenantDetails(tenantId, { ...validInput, name: NEW_NAME }),
    );

    expect(name).toBe(NEW_NAME);
  });

  it.each([
    ['no later step has run', {}],
    [
      'a later step is stale-DONE from a prior run',
      { [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: DONE_STEP },
    ],
  ])(
    'updates primaryDomain when MAP_DOMAIN FAILED and %s',
    async (_description, laterSteps) => {
      const tenantId = await insertTenantWithDomain({
        domain: MOCK_TENANT_DOMAIN,
        provisioningSteps: stepsWith({
          ...EARLY_STEPS_DONE,
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: FAILED_STEP,
          ...laterSteps,
        }),
      });

      const { primaryDomain } = unwrapUpdated(
        await updateTenantDetails(tenantId, {
          ...validInput,
          primaryDomain: ACME_FIXED_DOMAIN,
        }),
      );

      expect(primaryDomain).toBe(ACME_FIXED_DOMAIN);
    },
  );

  it('still locks primaryDomain via a stale-DONE MAP_DOMAIN after an earlier failure', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: MOCK_TENANT_DOMAIN,
      provisioningSteps: stepsWith({
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: DONE_STEP,
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: DONE_STEP,
        [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: FAILED_STEP,
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: DONE_STEP,
        [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: DONE_STEP,
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
    await expect(
      updateTenantDetails(MOCK_MISSING_TENANT_ID, validInput),
    ).rejects.toThrow(
      `updateTenantDetails: no tenant found for id "${MOCK_MISSING_TENANT_ID}".`,
    );
  });

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
