import { ERROR_CODE } from '@blog/config/constants';
import {
  DAY_MS,
  GRACE_EMAIL,
  PLAN_ENTITLEMENTS,
  TENANT_PLAN,
  type TGraceEmail,
} from '@blog/db/constants';
import { deleteCustomDomainClaim } from '@blog/db/queries/custom-domain-claims';
import {
  countMembershipsOverSeats,
  getTenantOwnerEmail,
  lockMembershipsOverSeats,
} from '@blog/db/queries/memberships';
import { listTenantHosts } from '@blog/db/queries/tenant-domains/list-tenant-hosts';
import {
  claimGraceEmail,
  endDowngradeGrace,
  endTenantTrial,
  listTenantsDueForGraceEmail,
  listTenantsDueForGraceEnd,
  listTenantsWithEndedTrial,
  setTenantPrimaryDomain,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';
import { sendEmail } from '@blog/email';
import { errorResult, okResult } from '@blog/utils';
import {
  DOWNGRADE_GRACE_LOG,
  DOWNGRADE_GRACE_STEP,
} from '@worker/constants/downgrade-grace';
import { MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import { mockInactivitySweepEnv } from '@worker/testing/inactivity-sweep-env/fake-inactivity-sweep-env';
import { createMockFaker } from '@worker/testing/mock-faker';
import { MOCK_DB_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_OWNER_EMAIL } from '@worker/testing/owner-access/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  mockTenant,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { OWNER_GRACE_EMAIL_COPY } from '@worker/utils/owner-email/owner-grace-email-copy/owner-grace-email-copy';

import { runDowngradeGraceSweep } from './run-downgrade-grace-sweep';

const MOCK_SWEEP_ENV = mockInactivitySweepEnv();
const MOCK_DAY_0_GRACE_END_DATE = 'November 4, 2026';
const MOCK_SITE_NAME = mockTenant().name;
const MOCK_EXTRA_MEMBERS = 2;
const MOCK_SECOND_TENANT_ID = createMockFaker(6875).string.uuid();
const COPY = OWNER_GRACE_EMAIL_COPY.EN;
const MOCK_NOTHING_DONE = {
  [DOWNGRADE_GRACE_STEP.TRIAL_END]: 0,
  [DOWNGRADE_GRACE_STEP.GRACE_END]: 0,
  [GRACE_EMAIL.STARTED]: 0,
  [GRACE_EMAIL.HALFWAY]: 0,
  [GRACE_EMAIL.ENDING]: 0,
};

vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/queries/custom-domain-claims');
vi.mock('@blog/db/queries/tenant-domains/list-tenant-hosts');
vi.mock('@blog/db/utils/tenant-cache/request-tenant-cache-invalidation');
vi.mock('@blog/email/transport/send-email');

function inGraceFor(days: number, overrides: Partial<TTenant> = {}): TTenant {
  return mockTenant({
    downgradeGraceStartedAt: new Date(MOCK_NOW.getTime() - days * DAY_MS),
    ...overrides,
  });
}

function emailDue(email: TGraceEmail, tenants: TTenant[]): void {
  vi.mocked(listTenantsDueForGraceEmail).mockImplementation(async (due) =>
    due === email ? tenants : [],
  );
  vi.mocked(claimGraceEmail).mockImplementation(
    async (id) => tenants.find((tenant) => tenant.id === id) ?? null,
  );
}

function sweep() {
  return runDowngradeGraceSweep({ now: MOCK_NOW, env: MOCK_SWEEP_ENV });
}

function sentEmails() {
  return vi.mocked(sendEmail).mock.calls.map(([input]) => input);
}

beforeEach(() => {
  vi.mocked(listTenantsWithEndedTrial).mockResolvedValue([]);
  vi.mocked(listTenantsDueForGraceEnd).mockResolvedValue([]);
  vi.mocked(listTenantsDueForGraceEmail).mockResolvedValue([]);
  vi.mocked(listTenantHosts).mockResolvedValue([MOCK_TENANT_DOMAIN]);
  vi.mocked(countMembershipsOverSeats).mockResolvedValue(0);
  vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
  vi.mocked(sendEmail).mockResolvedValue();
  vi.mocked(requestTenantCacheInvalidation).mockResolvedValue();
  vi.mocked(endDowngradeGrace).mockResolvedValue(true);
  vi.mocked(setTenantPrimaryDomain).mockImplementation(async (id) =>
    okResult(mockTenant({ id })),
  );
});

describe(runDowngradeGraceSweep, () => {
  describe('a trial past its end', () => {
    beforeEach(() => {
      vi.mocked(listTenantsWithEndedTrial).mockResolvedValue([mockTenant()]);
      vi.mocked(endTenantTrial).mockResolvedValue(inGraceFor(0));
    });

    it('ends the trial and refreshes the site for its Free plan', async () => {
      await expect(sweep()).resolves.toEqual({
        ...MOCK_NOTHING_DONE,
        [DOWNGRADE_GRACE_STEP.TRIAL_END]: 1,
      });
      expect(endTenantTrial).toHaveBeenCalledWith(MOCK_TENANT_ID, MOCK_NOW);
      expect(requestTenantCacheInvalidation).toHaveBeenCalledWith({
        webAppUrl: MOCK_SWEEP_ENV.webAppBaseUrl,
        secret: MOCK_SWEEP_ENV.siteConfigRevalidateSecret,
        tenantId: MOCK_TENANT_ID,
      });
    });

    it('counts nothing when another sweep ended it first', async () => {
      vi.mocked(endTenantTrial).mockResolvedValue(null);

      await expect(sweep()).resolves.toEqual(MOCK_NOTHING_DONE);
      expect(requestTenantCacheInvalidation).not.toHaveBeenCalled();
    });
  });

  describe('on day 0', () => {
    beforeEach(() => {
      emailDue(GRACE_EMAIL.STARTED, [inGraceFor(0)]);
    });

    it('tells the owner the site is on Free even when nothing will lock', async () => {
      await sweep();

      const [email] = sentEmails();
      const { subject } = COPY.emails[GRACE_EMAIL.STARTED]({
        siteName: MOCK_SITE_NAME,
        date: MOCK_DAY_0_GRACE_END_DATE,
      });
      expect(sentEmails()).toHaveLength(1);
      expect(email?.to).toBe(MOCK_OWNER_EMAIL);
      expect(email?.subject).toBe(subject);
      expect(email?.text).toContain(COPY.upgradeAnyTime);
    });

    it('names the members who will lose access and when', async () => {
      vi.mocked(countMembershipsOverSeats).mockResolvedValue(
        MOCK_EXTRA_MEMBERS,
      );

      await sweep();

      expect(sentEmails()[0]?.text).toContain(
        COPY.memberLock({
          count: MOCK_EXTRA_MEMBERS,
          date: MOCK_DAY_0_GRACE_END_DATE,
        }),
      );
    });

    it('sends nothing when another sweep already sent it', async () => {
      vi.mocked(claimGraceEmail).mockResolvedValue(null);

      await expect(sweep()).resolves.toEqual(MOCK_NOTHING_DONE);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('logs a tenant with no owner and sends it nothing', async () => {
      vi.mocked(getTenantOwnerEmail).mockResolvedValue(undefined);

      await sweep();

      expect(sendEmail).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        DOWNGRADE_GRACE_LOG.OWNER_MISSING,
        { tenantId: MOCK_TENANT_ID, email: GRACE_EMAIL.STARTED },
      );
    });
  });

  describe.each([
    [GRACE_EMAIL.HALFWAY, 7, 'October 28, 2026'],
    [GRACE_EMAIL.ENDING, 13, 'October 22, 2026'],
  ] as [TGraceEmail, number, string][])(
    'the %s email',
    (email, days, graceEndDate) => {
      beforeEach(() => {
        emailDue(email, [inGraceFor(days)]);
      });

      it('is neither claimed nor sent when nothing will lock', async () => {
        await sweep();

        expect(claimGraceEmail).not.toHaveBeenCalled();
        expect(sendEmail).not.toHaveBeenCalled();
      });

      it('names the custom domain that will stop being the main address', async () => {
        vi.mocked(listTenantHosts).mockResolvedValue([
          MOCK_CUSTOM_DOMAIN,
          MOCK_TENANT_DOMAIN,
        ]);

        await sweep();

        expect(sentEmails()[0]?.text).toContain(
          COPY.domainLock({
            customDomain: MOCK_CUSTOM_DOMAIN,
            subdomain: MOCK_TENANT_DOMAIN,
            date: graceEndDate,
          }),
        );
      });
    },
  );

  describe('on day 14', () => {
    const tenant = inGraceFor(14, { primaryDomain: MOCK_CUSTOM_DOMAIN });

    beforeEach(() => {
      vi.mocked(listTenantsDueForGraceEnd).mockResolvedValue([tenant]);
      vi.mocked(listTenantHosts).mockResolvedValue([
        MOCK_CUSTOM_DOMAIN,
        MOCK_TENANT_DOMAIN,
      ]);
    });

    it('locks members over the Free seats and moves to the subdomain', async () => {
      await expect(sweep()).resolves.toEqual({
        ...MOCK_NOTHING_DONE,
        [DOWNGRADE_GRACE_STEP.GRACE_END]: 1,
      });
      expect(lockMembershipsOverSeats).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].seats,
        MOCK_NOW,
      );
      expect(setTenantPrimaryDomain).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_TENANT_DOMAIN,
      );
      expect(deleteCustomDomainClaim).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(requestTenantCacheInvalidation).toHaveBeenCalled();
      expect(endDowngradeGrace).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        tenant.downgradeGraceStartedAt,
      );
    });

    it('keeps the custom domain of a tenant that upgraded', async () => {
      vi.mocked(listTenantsDueForGraceEnd).mockResolvedValue([
        { ...tenant, plan: TENANT_PLAN.GROWTH },
      ]);

      await sweep();

      expect(lockMembershipsOverSeats).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        PLAN_ENTITLEMENTS[TENANT_PLAN.GROWTH].seats,
        MOCK_NOW,
      );
      expect(setTenantPrimaryDomain).not.toHaveBeenCalled();
    });

    it('logs a site with no subdomain and still ends its grace', async () => {
      vi.mocked(listTenantHosts).mockResolvedValue([MOCK_CUSTOM_DOMAIN]);

      await sweep();

      expect(setTenantPrimaryDomain).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        DOWNGRADE_GRACE_LOG.SUBDOMAIN_MISSING,
        { tenantId: MOCK_TENANT_ID },
      );
      expect(endDowngradeGrace).toHaveBeenCalled();
    });

    it('logs a failed address switch and keeps the grace for the next sweep', async () => {
      vi.mocked(setTenantPrimaryDomain).mockResolvedValue(
        errorResult(ERROR_CODE.DB_NOT_FOUND),
      );

      await sweep();

      expect(endDowngradeGrace).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        DOWNGRADE_GRACE_LOG.STEP_FAILED,
        {
          tenantId: MOCK_TENANT_ID,
          step: DOWNGRADE_GRACE_STEP.GRACE_END,
          error: ERROR_CODE.DB_NOT_FOUND,
        },
      );
    });
  });

  it('never touches the platform tenant', async () => {
    vi.mocked(listTenantsDueForGraceEnd).mockResolvedValue([inGraceFor(14)]);
    vi.mocked(listTenantHosts).mockResolvedValue([MOCK_TENANT_ROOT_DOMAIN]);

    await expect(sweep()).resolves.toEqual(MOCK_NOTHING_DONE);
    expect(lockMembershipsOverSeats).not.toHaveBeenCalled();
  });

  it('logs a tenant whose step fails and carries on with the next', async () => {
    const secondTenant = inGraceFor(14, { id: MOCK_SECOND_TENANT_ID });
    vi.mocked(listTenantsDueForGraceEnd).mockResolvedValue([
      inGraceFor(14),
      secondTenant,
    ]);
    vi.mocked(lockMembershipsOverSeats).mockRejectedValueOnce(
      new Error(MOCK_DB_DOWN),
    );

    await expect(sweep()).resolves.toEqual({
      ...MOCK_NOTHING_DONE,
      [DOWNGRADE_GRACE_STEP.GRACE_END]: 1,
    });
    expect(endDowngradeGrace).toHaveBeenCalledExactlyOnceWith(
      secondTenant.id,
      secondTenant.downgradeGraceStartedAt,
    );
  });
});
