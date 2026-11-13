import { ERROR_CODE, TENANT_PLAN } from '@blog/config/constants';
import { GRACE_EMAIL, type TGraceEmail } from '@blog/db/constants';
import { deleteCustomDomainClaim } from '@blog/db/queries/custom-domain-claims';
import { stopPendingInvitesOverSeats } from '@blog/db/queries/membership-invites';
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
  restoreDowngradeGrace,
  setTenantPrimaryDomain,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { daysAfter, daysBefore } from '@blog/db/utils/day-offset/day-offset';
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
import {
  MOCK_DB_DOWN,
  MOCK_RESEND_DOWN,
} from '@worker/testing/outage/fixtures';
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
vi.mock('@blog/db/queries/membership-invites');
vi.mock('@blog/db/queries/custom-domain-claims');
vi.mock('@blog/db/queries/tenant-domains/list-tenant-hosts');
vi.mock('@blog/db/utils/tenant-cache/request-tenant-cache-invalidation');
vi.mock('@blog/email/transport/send-email');

function inGraceFor(days: number, overrides: Partial<TTenant> = {}): TTenant {
  return mockTenant({
    downgradeGraceStartedAt: daysBefore(MOCK_NOW, days),
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
  vi.mocked(restoreDowngradeGrace).mockResolvedValue(true);
  vi.mocked(endDowngradeGrace).mockImplementation(async (id) =>
    mockTenant({ id, downgradeGraceStartedAt: null, downgradedFromPlan: null }),
  );
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

    it('names what a site leaving Starter lost', async () => {
      emailDue(GRACE_EMAIL.STARTED, [
        inGraceFor(0, { downgradedFromPlan: TENANT_PLAN.STARTER }),
      ]);

      await sweep();

      expect(sentEmails()[0]?.text).toContain(
        COPY.stopped[TENANT_PLAN.STARTER],
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
        vi.mocked(listTenantHosts).mockResolvedValue([
          MOCK_CUSTOM_DOMAIN,
          MOCK_TENANT_DOMAIN,
        ]);
      });

      it('is neither claimed nor sent when nothing will lock', async () => {
        await sweep();

        expect(claimGraceEmail).not.toHaveBeenCalled();
        expect(sendEmail).not.toHaveBeenCalled();
      });

      it('names the custom domain that will stop being the main address', async () => {
        emailDue(email, [
          inGraceFor(days, { primaryDomain: MOCK_CUSTOM_DOMAIN }),
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
    const tenant = inGraceFor(14, {
      primaryDomain: MOCK_CUSTOM_DOMAIN,
      downgradedFromPlan: TENANT_PLAN.GROWTH,
    });

    beforeEach(() => {
      vi.mocked(listTenantsDueForGraceEnd).mockResolvedValue([tenant]);
      vi.mocked(endDowngradeGrace).mockResolvedValue({
        ...tenant,
        downgradeGraceStartedAt: null,
        downgradedFromPlan: null,
      });
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
        TENANT_PLAN.FREE,
        MOCK_NOW,
      );
      expect(setTenantPrimaryDomain).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_TENANT_DOMAIN,
        TENANT_PLAN.FREE,
      );
      expect(stopPendingInvitesOverSeats).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        TENANT_PLAN.FREE,
      );
      expect(deleteCustomDomainClaim).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        TENANT_PLAN.FREE,
      );
      expect(requestTenantCacheInvalidation).toHaveBeenCalled();
      expect(endDowngradeGrace).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        tenant.downgradeGraceStartedAt,
      );
    });

    it('touches nothing on a site that upgraded while the sweep ran', async () => {
      vi.mocked(endDowngradeGrace).mockResolvedValue(null);

      await expect(sweep()).resolves.toEqual(MOCK_NOTHING_DONE);
      expect(lockMembershipsOverSeats).not.toHaveBeenCalled();
      expect(setTenantPrimaryDomain).not.toHaveBeenCalled();
    });

    it('logs a site with no subdomain and still locks its members', async () => {
      vi.mocked(listTenantHosts).mockResolvedValue([MOCK_CUSTOM_DOMAIN]);

      await sweep();

      expect(setTenantPrimaryDomain).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        DOWNGRADE_GRACE_LOG.SUBDOMAIN_MISSING,
        { tenantId: MOCK_TENANT_ID },
      );
      expect(lockMembershipsOverSeats).toHaveBeenCalled();
    });

    describe('when the address switch fails', () => {
      beforeEach(() => {
        vi.mocked(setTenantPrimaryDomain).mockResolvedValue(
          errorResult(ERROR_CODE.DB_NOT_FOUND),
        );
      });

      it('gives the grace back and logs it', async () => {
        await sweep();

        expect(restoreDowngradeGrace).toHaveBeenCalledWith(MOCK_TENANT_ID, {
          graceStartedAt: tenant.downgradeGraceStartedAt,
          downgradedFromPlan: tenant.downgradedFromPlan,
        });
        expect(logger.error).toHaveBeenCalledWith(
          DOWNGRADE_GRACE_LOG.GRACE_END_FAILED,
          {
            tenantId: MOCK_TENANT_ID,
            isGivenBack: true,
            error: ERROR_CODE.DB_NOT_FOUND,
          },
        );
      });

      it('logs no failure for a site that moved off Free while the sweep ran', async () => {
        vi.mocked(restoreDowngradeGrace).mockResolvedValue(false);

        await sweep();

        expect(logger.error).not.toHaveBeenCalledWith(
          DOWNGRADE_GRACE_LOG.GRACE_END_FAILED,
          expect.anything(),
        );
      });
    });

    describe('when locking fails', () => {
      beforeEach(() => {
        vi.mocked(lockMembershipsOverSeats).mockRejectedValueOnce(
          new Error(MOCK_DB_DOWN),
        );
      });

      it('retries a failed lock on the next day’s sweep', async () => {
        await expect(sweep()).resolves.toEqual(MOCK_NOTHING_DONE);
        await expect(
          runDowngradeGraceSweep({
            now: daysAfter(MOCK_NOW, 1),
            env: MOCK_SWEEP_ENV,
          }),
        ).resolves.toEqual({
          ...MOCK_NOTHING_DONE,
          [DOWNGRADE_GRACE_STEP.GRACE_END]: 1,
        });
        expect(lockMembershipsOverSeats).toHaveBeenCalledTimes(2);
      });

      it('still logs the failure when giving the grace back throws', async () => {
        vi.mocked(restoreDowngradeGrace).mockRejectedValue(
          new Error(MOCK_RESEND_DOWN),
        );

        await sweep();

        expect(logger.error).toHaveBeenCalledWith(
          DOWNGRADE_GRACE_LOG.GRACE_END_FAILED,
          {
            tenantId: MOCK_TENANT_ID,
            isGivenBack: false,
            error: MOCK_DB_DOWN,
            giveBackError: MOCK_RESEND_DOWN,
          },
        );
      });
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
    expect(vi.mocked(lockMembershipsOverSeats).mock.lastCall?.[0]).toBe(
      secondTenant.id,
    );
  });
});
