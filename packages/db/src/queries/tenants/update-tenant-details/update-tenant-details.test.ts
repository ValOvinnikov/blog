import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_DETAILS_UPDATE_OUTCOME,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
  type TTenantProvisioningStatus,
} from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import { type users, verificationTokens } from '@blog/db/schema/auth';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import {
  tenants,
  type TTenant,
  type TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { GITHUB_PROVIDER } from '@blog/db/testing/account/fixtures';
import {
  MOCK_EMAIL_VERIFIED_AT,
  MOCK_OWNER_EMAIL,
  insertTestAccount,
  insertTestTenant,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_SANITY_PROJECT_ID } from '@blog/db/testing/sanity-management-client/fixtures';
import {
  MOCK_IDLE_PROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
  MOCK_TENANT_DOMAIN,
} from '@blog/db/testing/tenants/fixtures';
import {
  MOCK_SELF_SERVE_DOMAIN,
  MOCK_SELF_SERVE_OWNER_EMAIL,
  MOCK_SELF_SERVE_PADDED_DOMAIN,
  MOCK_SELF_SERVE_SCHEME_DOMAIN,
} from '@blog/db/testing/tenants/self-serve-fixtures';
import { faker } from '@faker-js/faker';
import { and, eq } from 'drizzle-orm';

import {
  updateTenantDetails,
  type TUpdateTenantDetailsInput,
  type TUpdateTenantDetailsResult,
} from './update-tenant-details';

vi.mock('@blog/db/client');

faker.seed(6020);

const db = useQueryTestDb();

const MOCK_TENANT_NAME = faker.company.name();
const MOCK_NEW_NAME = faker.company.name();
const MOCK_UPDATED_NAME = faker.company.name();
const MOCK_NEW_DOMAIN = faker.internet.domainName();
const MOCK_ALT_DOMAIN = faker.internet.domainName();
const MOCK_FIXED_DOMAIN = faker.internet.domainName();
const MOCK_OTHER_TENANT_DOMAIN = faker.internet.domainName();
const MOCK_NEW_OWNER_EMAIL = faker.internet.email().toLowerCase();
const MOCK_UNNORMALIZED_NEW_OWNER_EMAIL = `  ${MOCK_NEW_OWNER_EMAIL.toUpperCase()}  `;
const MOCK_MEMBER_EMAIL = faker.internet.email().toLowerCase();
const MOCK_OTHER_EMAIL = faker.internet.email().toLowerCase();
const MOCK_TOKEN_EXPIRES_AT = faker.date.future();

const {
  UPDATED,
  OWNER_ALREADY_JOINED,
  PROVISIONING_STARTED,
  DOMAIN_TAKEN,
  DOMAIN_LOCKED,
  DOMAIN_INVALID,
  OWNER_EMAIL_TAKEN,
  OWNS_FREE_TENANT,
} = TENANT_DETAILS_UPDATE_OUTCOME;

const { RUNNING, DONE, FAILED } = TENANT_PROVISIONING_STEP_STATUS;
const MOCK_RUNNING_STEP = { status: RUNNING };
const MOCK_DONE_STEP = { status: DONE };
const MOCK_FAILED_STEP = { status: FAILED };

const MOCK_EARLY_STEPS_DONE = {
  [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: MOCK_DONE_STEP,
  [TENANT_PROVISIONING_STEP.SEED_CONTENT]: MOCK_DONE_STEP,
  [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: MOCK_DONE_STEP,
};

const MOCK_CORE_STEPS_DONE = {
  ...MOCK_EARLY_STEPS_DONE,
  [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: MOCK_DONE_STEP,
  [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: MOCK_DONE_STEP,
  [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: MOCK_DONE_STEP,
};

const MOCK_ORIGINAL_DETAILS = {
  name: MOCK_TENANT_NAME,
  primaryDomain: MOCK_TENANT_DOMAIN,
  plan: TENANT_PLAN.FREE,
  locale: LOCALE_ISO_CODES.EN,
};

const MOCK_VALID_INPUT: TUpdateTenantDetailsInput = {
  name: MOCK_UPDATED_NAME,
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
    name: MOCK_TENANT_NAME,
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
      ...inviteEmailColumns(email),
      role: MEMBERSHIP_ROLE.OWNER,
    });
}

async function insertOwnerMember(
  tenantId: string,
  user: Partial<typeof users.$inferInsert>,
): Promise<string> {
  const { id: userId } = await insertTestUser(db(), user);

  await db()
    .insert(memberships)
    .values({ tenantId, userId, role: MEMBERSHIP_ROLE.OWNER });

  return userId;
}

async function insertJoinedOwner(
  tenantId: string,
  email?: string,
): Promise<void> {
  await insertOwnerMember(tenantId, {
    ...(email && userPersonalColumns({ email })),
    emailVerified: MOCK_EMAIL_VERIFIED_AT,
  });
}

async function insertVerificationToken(identifier: string): Promise<void> {
  await db()
    .insert(verificationTokens)
    .values({
      identifier,
      token: faker.string.alphanumeric(32),
      expires: MOCK_TOKEN_EXPIRES_AT,
    });
}

async function readVerificationIdentifiers(): Promise<string[]> {
  const rows = await db()
    .select({ identifier: verificationTokens.identifier })
    .from(verificationTokens);
  return rows.map(({ identifier }) => identifier).sort();
}

async function readOwnerMembership(tenantId: string) {
  const [membership] = await db()
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.tenantId, tenantId),
        eq(memberships.role, MEMBERSHIP_ROLE.OWNER),
      ),
    );
  return membership;
}

function unwrapUpdatedResult(
  result: TUpdateTenantDetailsResult,
): Extract<TUpdateTenantDetailsResult, { outcome: typeof UPDATED }> {
  if (result.outcome !== UPDATED) {
    throw new Error(`expected '${UPDATED}', got '${result.outcome}'`);
  }
  return result;
}

function unwrapUpdated(result: TUpdateTenantDetailsResult): TTenant {
  return unwrapUpdatedResult(result).tenant;
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
  await db().delete(schema.verificationTokens);
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
          ...MOCK_VALID_INPUT,
          name: MOCK_NEW_NAME,
          locale: LOCALE_ISO_CODES.FR,
          plan: TENANT_PLAN.GROWTH,
        }),
      );

      expect(name).toBe(MOCK_NEW_NAME);
      expect(locale).toBe(LOCALE_ISO_CODES.FR);
      expect(plan).toBe(TENANT_PLAN.GROWTH);
    });

    it('updates primaryDomain and moves the matching tenant_domains row with it', async () => {
      const { primaryDomain } = unwrapUpdated(
        await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          primaryDomain: MOCK_NEW_DOMAIN,
        }),
      );

      expect(primaryDomain).toBe(MOCK_NEW_DOMAIN);
      const domains = await readDomains(tenantId);
      expect(domains).toEqual([MOCK_NEW_DOMAIN]);
    });

    describe('with a pending owner invite', () => {
      beforeEach(async () => {
        await insertOwnerInvite(tenantId, MOCK_OWNER_EMAIL);
      });

      it('rewrites the pending owner invite to the normalized new address', async () => {
        const result = await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          ownerEmail: MOCK_UNNORMALIZED_NEW_OWNER_EMAIL,
        });

        const { ownerEmailChanged } = unwrapUpdatedResult(result);
        expect(ownerEmailChanged).toBe(true);

        const invite = await readOwnerInvite(tenantId);
        expect(decryptTestPersonalValue(invite?.emailEncrypted ?? null)).toBe(
          MOCK_NEW_OWNER_EMAIL,
        );
        expect(invite?.emailIndex).toBe(
          testPersonalEmailIndex(MOCK_NEW_OWNER_EMAIL),
        );
        expect(decryptTestPersonalValue(invite?.emailEncrypted ?? null)).toBe(
          MOCK_NEW_OWNER_EMAIL,
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
              ...MOCK_VALID_INPUT,
              name: MOCK_NEW_NAME,
              ownerEmail,
            }),
          );

          expect(name).toBe(MOCK_NEW_NAME);
          const ownerInvite = await readOwnerInvite(tenantId);
          expect(
            decryptTestPersonalValue(ownerInvite?.emailEncrypted ?? null),
          ).toBe(MOCK_OWNER_EMAIL);
        },
      );

      it("revokes unused sign-in links sent to the old address, keeping everyone else's", async () => {
        await insertVerificationToken(MOCK_OWNER_EMAIL);
        await insertVerificationToken(MOCK_MEMBER_EMAIL);

        await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          ownerEmail: MOCK_NEW_OWNER_EMAIL,
        });

        const identifiers = await readVerificationIdentifiers();
        expect(identifiers).toEqual([MOCK_MEMBER_EMAIL]);
      });

      it("keeps the old address's sign-in links when the owner email is unchanged", async () => {
        await insertVerificationToken(MOCK_OWNER_EMAIL);

        const result = await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          ownerEmail: MOCK_OWNER_EMAIL,
        });

        const { ownerEmailChanged } = unwrapUpdatedResult(result);
        expect(ownerEmailChanged).toBe(false);
        const identifiers = await readVerificationIdentifiers();
        expect(identifiers).toEqual([MOCK_OWNER_EMAIL]);
      });

      it('returns owner-email-taken when the new email matches another invite', async () => {
        await db()
          .insert(membershipInvites)
          .values({
            tenantId,
            ...inviteEmailColumns(MOCK_MEMBER_EMAIL),
            role: MEMBERSHIP_ROLE.EDITOR,
          });

        const result = await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          ownerEmail: MOCK_MEMBER_EMAIL,
        });

        expect(result).toEqual({ outcome: OWNER_EMAIL_TAKEN });
        const ownerInvite = await readOwnerInvite(tenantId);
        expect(
          decryptTestPersonalValue(ownerInvite?.emailEncrypted ?? null),
        ).toBe(MOCK_OWNER_EMAIL);
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
              ...MOCK_VALID_INPUT,
              name: MOCK_NEW_NAME,
              ownerEmail,
            }),
          );

          expect(name).toBe(MOCK_NEW_NAME);
        },
      );

      it("returns owner-already-joined when ownerEmail differs from the owner's", async () => {
        const result = await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          name: MOCK_NEW_NAME,
          ownerEmail: MOCK_OTHER_EMAIL,
        });

        expect(result).toEqual({ outcome: OWNER_ALREADY_JOINED });
        const details = await readDetails(tenantId);
        expect(details?.name).toBe(MOCK_TENANT_NAME);
      });
    });

    describe('with an owner account that has never signed in', () => {
      let ownerUserId: string;

      beforeEach(async () => {
        ownerUserId = await insertOwnerMember(
          tenantId,
          userPersonalColumns({ email: MOCK_OWNER_EMAIL }),
        );
      });

      it('swaps the owner membership for a pending invite to the new address', async () => {
        const result = await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          ownerEmail: MOCK_NEW_OWNER_EMAIL,
        });

        const { ownerEmailChanged } = unwrapUpdatedResult(result);
        expect(ownerEmailChanged).toBe(true);
        const ownerMembership = await readOwnerMembership(tenantId);
        expect(ownerMembership).toBeUndefined();
        const ownerInvite = await readOwnerInvite(tenantId);
        expect(
          decryptTestPersonalValue(ownerInvite?.emailEncrypted ?? null),
        ).toBe(MOCK_NEW_OWNER_EMAIL);
      });

      it('returns owner-already-joined once the owner has linked an OAuth account', async () => {
        await insertTestAccount(db(), ownerUserId, GITHUB_PROVIDER);

        const result = await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          ownerEmail: MOCK_NEW_OWNER_EMAIL,
        });

        const ownerMembership = await readOwnerMembership(tenantId);
        const ownerInvite = await readOwnerInvite(tenantId);
        expect(result).toEqual({ outcome: OWNER_ALREADY_JOINED });
        expect(ownerMembership?.userId).toBe(ownerUserId);
        expect(ownerInvite).toBeUndefined();
      });
    });

    it('returns owner-already-joined and changes nothing once the owner signed in', async () => {
      await insertJoinedOwner(tenantId);

      const result = await updateTenantDetails(tenantId, {
        ...MOCK_VALID_INPUT,
        name: MOCK_NEW_NAME,
        ownerEmail: MOCK_NEW_OWNER_EMAIL,
      });

      expect(result).toEqual({ outcome: OWNER_ALREADY_JOINED });
      const details = await readDetails(tenantId);
      expect(details?.name).toBe(MOCK_TENANT_NAME);
      const ownerInvite = await readOwnerInvite(tenantId);
      expect(ownerInvite).toBeUndefined();
    });

    it('returns domain-taken when renaming onto its own secondary domain', async () => {
      await db()
        .insert(tenantDomains)
        .values({ tenantId, domain: MOCK_ALT_DOMAIN });

      const result = await updateTenantDetails(tenantId, {
        ...MOCK_VALID_INPUT,
        primaryDomain: MOCK_ALT_DOMAIN,
      });

      expect(result).toEqual({ outcome: DOMAIN_TAKEN });
      const details = await readDetails(tenantId);
      expect(details).toEqual(MOCK_ORIGINAL_DETAILS);
      const domains = await readDomains(tenantId);
      expect(domains).toEqual([MOCK_ALT_DOMAIN, MOCK_TENANT_DOMAIN].sort());
    });

    it.each([
      ['a scheme-prefixed value', MOCK_SELF_SERVE_SCHEME_DOMAIN],
      ['a trailing-slash value', `${MOCK_SELF_SERVE_DOMAIN}/`],
      ['a whitespace-padded value', MOCK_SELF_SERVE_PADDED_DOMAIN],
    ])(
      'returns domain-invalid for %s primaryDomain and applies no changes',
      async (_description, primaryDomain) => {
        const result = await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          name: MOCK_NEW_NAME,
          primaryDomain,
        });

        expect(result).toEqual({ outcome: DOMAIN_INVALID });
        const details = await readDetails(tenantId);
        expect(details).toEqual(MOCK_ORIGINAL_DETAILS);
        const domains = await readDomains(tenantId);
        expect(domains).toEqual([MOCK_TENANT_DOMAIN]);
      },
    );
  });

  describe('a tenant with a RUNNING step', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenantWithDomain({
        provisioningSteps: stepsWith({
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: MOCK_RUNNING_STEP,
        }),
      });
    });

    it('refuses with provisioning-started and leaves the row unchanged', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...MOCK_VALID_INPUT,
        name: MOCK_NEW_NAME,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });
      const details = await readDetails(tenantId);
      expect(details?.name).toBe(MOCK_TENANT_NAME);
    });

    it('refuses an ownerEmail edit with provisioning-started, leaving the invite', async () => {
      await insertOwnerInvite(tenantId, MOCK_OWNER_EMAIL);

      const result = await updateTenantDetails(tenantId, {
        ...MOCK_VALID_INPUT,
        ownerEmail: MOCK_NEW_OWNER_EMAIL,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });
      const ownerInvite = await readOwnerInvite(tenantId);
      expect(
        decryptTestPersonalValue(ownerInvite?.emailEncrypted ?? null),
      ).toBe(MOCK_OWNER_EMAIL);
    });
  });

  describe('a tenant whose provisioning has succeeded, with a pending owner invite', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenantWithDomain({
        provisioningSteps: stepsWith(MOCK_CORE_STEPS_DONE),
      });
      await insertOwnerInvite(tenantId, MOCK_OWNER_EMAIL);
    });

    it('accepts a change to the owner email alone', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...MOCK_ORIGINAL_DETAILS,
        ownerEmail: MOCK_NEW_OWNER_EMAIL,
      });

      const { ownerEmailChanged } = unwrapUpdatedResult(result);
      expect(ownerEmailChanged).toBe(true);
      const ownerInvite = await readOwnerInvite(tenantId);
      expect(
        decryptTestPersonalValue(ownerInvite?.emailEncrypted ?? null),
      ).toBe(MOCK_NEW_OWNER_EMAIL);
    });

    it('refuses an owner-email change bundled with another field, leaving the invite', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...MOCK_ORIGINAL_DETAILS,
        name: MOCK_NEW_NAME,
        ownerEmail: MOCK_NEW_OWNER_EMAIL,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });
      const ownerInvite = await readOwnerInvite(tenantId);
      expect(
        decryptTestPersonalValue(ownerInvite?.emailEncrypted ?? null),
      ).toBe(MOCK_OWNER_EMAIL);
    });
  });

  describe('with another tenant owning the default domain', () => {
    beforeEach(async () => {
      await insertTenantWithDomain({ domain: MOCK_TENANT_DOMAIN });
    });

    it('returns domain-taken on a domain collision', async () => {
      const secondTenantId = await insertTenantWithDomain({
        domain: MOCK_OTHER_TENANT_DOMAIN,
      });

      const result = await updateTenantDetails(secondTenantId, {
        ...MOCK_VALID_INPUT,
        primaryDomain: MOCK_TENANT_DOMAIN,
      });

      expect(result).toEqual({ outcome: DOMAIN_TAKEN });
      const details = await readDetails(secondTenantId);
      expect(details).toEqual({
        ...MOCK_ORIGINAL_DETAILS,
        primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
      });
      const domains = await readDomains(secondTenantId);
      expect(domains).toEqual([MOCK_OTHER_TENANT_DOMAIN]);
    });

    it('returns provisioning-started over domain-taken when both apply', async () => {
      const secondTenantId = await insertTenantWithDomain({
        domain: MOCK_OTHER_TENANT_DOMAIN,
        provisioningSteps: stepsWith({
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: MOCK_RUNNING_STEP,
        }),
      });

      const result = await updateTenantDetails(secondTenantId, {
        ...MOCK_VALID_INPUT,
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
          ...MOCK_EARLY_STEPS_DONE,
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: MOCK_DONE_STEP,
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: MOCK_FAILED_STEP,
        }),
      });
    });

    it('refuses a changed primaryDomain with domain-locked, leaving the row', async () => {
      const result = await updateTenantDetails(tenantId, {
        ...MOCK_VALID_INPUT,
        primaryDomain: MOCK_NEW_DOMAIN,
      });

      expect(result).toEqual({
        outcome: DOMAIN_LOCKED,
        blockingStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
      });
      const details = await readDetails(tenantId);
      expect(details?.primaryDomain).toBe(MOCK_TENANT_DOMAIN);
    });

    it('keeps name, plan and locale editable when primaryDomain is unchanged', async () => {
      const { name, plan, locale, primaryDomain } = unwrapUpdated(
        await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          primaryDomain: MOCK_TENANT_DOMAIN,
          name: MOCK_NEW_NAME,
          plan: TENANT_PLAN.GROWTH,
          locale: LOCALE_ISO_CODES.FR,
        }),
      );

      expect(name).toBe(MOCK_NEW_NAME);
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
      await updateTenantDetails(tenantId, {
        ...MOCK_VALID_INPUT,
        name: MOCK_NEW_NAME,
      }),
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
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: MOCK_DONE_STEP,
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
        provisioningSteps: stepsWith(MOCK_CORE_STEPS_DONE),
      },
    ],
    [
      'every core step has succeeded and OWNER_ELEVATION is FAILED',
      {
        provisioningSteps: stepsWith({
          ...MOCK_CORE_STEPS_DONE,
          [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: MOCK_FAILED_STEP,
        }),
      },
    ],
  ])(
    'refuses with provisioning-started when %s',
    async (_description, provisioning) => {
      const tenantId = await insertTenantWithDomain(provisioning);

      const result = await updateTenantDetails(tenantId, {
        ...MOCK_VALID_INPUT,
        name: MOCK_NEW_NAME,
      });

      expect(result).toEqual({ outcome: PROVISIONING_STARTED });
      const details = await readDetails(tenantId);
      expect(details?.name).toBe(MOCK_TENANT_NAME);
    },
  );

  it('still updates when every step is IDLE', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: MOCK_IDLE_PROVISIONING_STEPS,
    });

    const { name } = unwrapUpdated(
      await updateTenantDetails(tenantId, {
        ...MOCK_VALID_INPUT,
        name: MOCK_NEW_NAME,
      }),
    );

    expect(name).toBe(MOCK_NEW_NAME);
  });

  it.each([
    ['no later step has run', {}],
    [
      'a later step is stale-DONE from a prior run',
      { [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: MOCK_DONE_STEP },
    ],
  ])(
    'updates primaryDomain when MAP_DOMAIN FAILED and %s',
    async (_description, laterSteps) => {
      const tenantId = await insertTenantWithDomain({
        domain: MOCK_TENANT_DOMAIN,
        provisioningSteps: stepsWith({
          ...MOCK_EARLY_STEPS_DONE,
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: MOCK_FAILED_STEP,
          ...laterSteps,
        }),
      });

      const { primaryDomain } = unwrapUpdated(
        await updateTenantDetails(tenantId, {
          ...MOCK_VALID_INPUT,
          primaryDomain: MOCK_FIXED_DOMAIN,
        }),
      );

      expect(primaryDomain).toBe(MOCK_FIXED_DOMAIN);
    },
  );

  it('still locks primaryDomain via a stale-DONE MAP_DOMAIN after an earlier failure', async () => {
    const tenantId = await insertTenantWithDomain({
      domain: MOCK_TENANT_DOMAIN,
      provisioningSteps: stepsWith({
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: MOCK_DONE_STEP,
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: MOCK_DONE_STEP,
        [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: MOCK_FAILED_STEP,
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: MOCK_DONE_STEP,
        [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: MOCK_DONE_STEP,
      }),
    });

    const result = await updateTenantDetails(tenantId, {
      ...MOCK_VALID_INPUT,
      primaryDomain: MOCK_NEW_DOMAIN,
    });

    expect(result).toEqual({
      outcome: DOMAIN_LOCKED,
      blockingStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    });
  });

  it('throws for a tenant id that does not exist', async () => {
    await expect(
      updateTenantDetails(MOCK_MISSING_TENANT_ID, MOCK_VALID_INPUT),
    ).rejects.toThrow(
      `updateTenantDetails: no tenant found for id "${MOCK_MISSING_TENANT_ID}".`,
    );
  });

  it('refuses a move to FREE that would give a person a second Free site', async () => {
    const selfServeOwnerEmailIndex = testPersonalEmailIndex(
      MOCK_SELF_SERVE_OWNER_EMAIL,
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
      ...MOCK_VALID_INPUT,
      name: MOCK_NEW_NAME,
      plan: TENANT_PLAN.FREE,
    });

    expect(result).toEqual({ outcome: OWNS_FREE_TENANT });
    const [after] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(after).toEqual(before);
  });
});
