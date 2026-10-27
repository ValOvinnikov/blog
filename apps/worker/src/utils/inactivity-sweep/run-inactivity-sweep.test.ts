import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  DAY_MS,
  INACTIVITY_STAGE,
  SUSPENSION_REASON,
  TENANT_STATUS,
  type TInactivityStage,
} from '@blog/db/constants';
import { listSuperadminEmails } from '@blog/db/queries/admins';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import {
  listTenantsDueForInactivityStage,
  stampTenantInactivityStage,
  startDeprovisioningRun,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';
import { sendEmail } from '@blog/email';
import { faker } from '@faker-js/faker';
import { INACTIVITY_SWEEP_LOG } from '@worker/constants/inactivity-sweep';
import { MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import { mockInactivitySweepEnv } from '@worker/testing/inactivity-sweep-env/fake-inactivity-sweep-env';
import { MOCK_SUPERADMIN_EMAILS } from '@worker/testing/operator-email/fixtures';
import {
  MOCK_CACHE_DOWN,
  MOCK_RESEND_DOWN,
} from '@worker/testing/outage/fixtures';
import { MOCK_OWNER_EMAIL } from '@worker/testing/owner-access/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import {
  mockTenant,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
} from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { OWNER_INACTIVITY_EMAIL_COPY } from '@worker/utils/owner-email/owner-inactivity-email-copy';
import { deprovisionTenant } from '@worker/workflows/deprovision-tenant';
import { start } from 'workflow/api';

import { runInactivitySweep } from './run-inactivity-sweep';

faker.seed(6025);

const SWEEP_ENV = mockInactivitySweepEnv();
const SITE_URL = `https://${MOCK_TENANT_DOMAIN}`;
const NO_STAGE_ADVANCED = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: 0,
  [INACTIVITY_STAGE.SUSPENSION]: 0,
  [INACTIVITY_STAGE.DELETION_NOTICE]: 0,
  [INACTIVITY_STAGE.DEPROVISIONING]: 0,
};

vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/db/queries/admins');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/utils/tenant-cache/request-tenant-cache-invalidation');
vi.mock('@blog/email/transport/send-email');
vi.mock('@worker/workflows/deprovision-tenant');
vi.mock('workflow/api');

function inactiveFor(days: number, overrides: Partial<TTenant> = {}): TTenant {
  return mockTenant({
    lastActivityAt: new Date(MOCK_NOW.getTime() - days * DAY_MS),
    ...overrides,
  });
}

function dueAt(stage: TInactivityStage, tenants: TTenant[]): void {
  vi.mocked(listTenantsDueForInactivityStage).mockImplementation(
    async (dueStage) => (dueStage === stage ? tenants : []),
  );
}

function sweep() {
  return runInactivitySweep({ now: MOCK_NOW, env: SWEEP_ENV });
}

function sentEmails() {
  return vi.mocked(sendEmail).mock.calls.map(([input]) => input);
}

function sentTo(): string[] {
  return sentEmails().map(({ to }) => to);
}

beforeEach(() => {
  vi.mocked(listTenantsDueForInactivityStage).mockResolvedValue([]);
  vi.mocked(stampTenantInactivityStage).mockImplementation(async (id) =>
    mockTenant({ id }),
  );
  vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
  vi.mocked(listSuperadminEmails).mockResolvedValue(MOCK_SUPERADMIN_EMAILS);
  vi.mocked(sendEmail).mockResolvedValue();
  vi.mocked(requestTenantCacheInvalidation).mockResolvedValue();
  vi.mocked(start).mockResolvedValue({ runId: MOCK_RUN_ID } as never);
});

describe(runInactivitySweep, () => {
  describe('at day 23', () => {
    const tenant = inactiveFor(23, { locale: LOCALE_ISO_CODES.FR });

    beforeEach(() => {
      dueAt(INACTIVITY_STAGE.SUSPENSION_WARNING, [tenant]);
      vi.mocked(stampTenantInactivityStage).mockResolvedValue(tenant);
    });

    it('stamps the warning before sending it', async () => {
      await sweep();

      expect(stampTenantInactivityStage).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        INACTIVITY_STAGE.SUSPENSION_WARNING,
        MOCK_NOW,
      );
    });

    it("warns the owner once, in the site's language, with the pause date", async () => {
      await sweep();

      const { subject } = OWNER_INACTIVITY_EMAIL_COPY.FR[
        INACTIVITY_STAGE.SUSPENSION_WARNING
      ]({
        siteName: tenant.name,
        siteUrl: SITE_URL,
        date: '28 octobre 2026',
      });
      const ownerEmails = sentEmails().filter(
        ({ to }) => to === MOCK_OWNER_EMAIL,
      );
      expect(ownerEmails).toHaveLength(1);
      expect(ownerEmails[0]?.subject).toBe(subject);
      expect(ownerEmails[0]?.html).toContain(
        `href="${SWEEP_ENV.platformAppBaseUrl}/dashboard"`,
      );
    });

    it('warns every super admin once, in English', async () => {
      await sweep();

      const alerts = sentEmails().filter(({ to }) =>
        MOCK_SUPERADMIN_EMAILS.includes(to),
      );
      expect(alerts.map(({ to }) => to)).toEqual(MOCK_SUPERADMIN_EMAILS);
      expect(alerts[0]?.subject).toContain('October 28, 2026');
    });

    it('reports the tenant as advanced', async () => {
      await expect(sweep()).resolves.toEqual({
        ...NO_STAGE_ADVANCED,
        [INACTIVITY_STAGE.SUSPENSION_WARNING]: 1,
      });
    });
  });

  describe('at day 30', () => {
    beforeEach(() => {
      dueAt(INACTIVITY_STAGE.SUSPENSION, [inactiveFor(30)]);
    });

    it('suspends the tenant for inactivity', async () => {
      await sweep();

      expect(stampTenantInactivityStage).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        INACTIVITY_STAGE.SUSPENSION,
        MOCK_NOW,
      );
    });

    it('purges the site cache so the next load serves the suspended site', async () => {
      await sweep();

      expect(requestTenantCacheInvalidation).toHaveBeenCalledWith({
        webAppUrl: SWEEP_ENV.webAppBaseUrl,
        secret: SWEEP_ENV.siteConfigRevalidateSecret,
        tenantId: MOCK_TENANT_ID,
      });
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('at day 50', () => {
    const tenant = inactiveFor(50, {
      locale: LOCALE_ISO_CODES.DE,
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
    });

    beforeEach(() => {
      dueAt(INACTIVITY_STAGE.DELETION_NOTICE, [tenant]);
      vi.mocked(stampTenantInactivityStage).mockResolvedValue(tenant);
    });

    it("sends the owner one deletion notice in the site's language", async () => {
      await sweep();

      const { subject } = OWNER_INACTIVITY_EMAIL_COPY.DE[
        INACTIVITY_STAGE.DELETION_NOTICE
      ]({
        siteName: tenant.name,
        siteUrl: SITE_URL,
        date: '31. Oktober 2026',
      });
      expect(sentTo()).toEqual([MOCK_OWNER_EMAIL]);
      expect(sentEmails()[0]?.subject).toBe(subject);
    });
  });

  describe('at day 60', () => {
    beforeEach(() => {
      dueAt(INACTIVITY_STAGE.DEPROVISIONING, [inactiveFor(60)]);
    });

    it('starts one deprovisioning run and records its start', async () => {
      await sweep();

      expect(start).toHaveBeenCalledExactlyOnceWith(deprovisionTenant, [
        MOCK_TENANT_ID,
      ]);
      expect(startDeprovisioningRun).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT_ID,
      });
    });
  });

  it('sends nothing for a tenant another sweep already moved into the stage', async () => {
    dueAt(INACTIVITY_STAGE.SUSPENSION_WARNING, [inactiveFor(23)]);
    vi.mocked(stampTenantInactivityStage).mockResolvedValue(null);

    await expect(sweep()).resolves.toEqual(NO_STAGE_ADVANCED);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('logs a tenant with no owner and sends it nothing', async () => {
    dueAt(INACTIVITY_STAGE.DELETION_NOTICE, [inactiveFor(50)]);
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(undefined);

    await sweep();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      INACTIVITY_SWEEP_LOG.OWNER_MISSING,
      {
        tenantId: MOCK_TENANT_ID,
        stage: INACTIVITY_STAGE.DELETION_NOTICE,
      },
    );
  });

  it('logs a failed owner email and still alerts the super admins', async () => {
    dueAt(INACTIVITY_STAGE.SUSPENSION_WARNING, [inactiveFor(23)]);
    vi.mocked(sendEmail).mockImplementation(async ({ to }) => {
      if (to === MOCK_OWNER_EMAIL) throw new Error(MOCK_RESEND_DOWN);
    });

    await sweep();

    const alertedAdmins = sentTo().filter((to) => to !== MOCK_OWNER_EMAIL);
    expect(alertedAdmins).toEqual(MOCK_SUPERADMIN_EMAILS);
    expect(logger.error).toHaveBeenCalledWith(
      INACTIVITY_SWEEP_LOG.EMAIL_SEND_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        stage: INACTIVITY_STAGE.SUSPENSION_WARNING,
        error: MOCK_RESEND_DOWN,
      },
    );
  });

  it('logs a tenant whose stage fails and carries on with the next', async () => {
    const secondTenantId = faker.string.uuid();
    dueAt(INACTIVITY_STAGE.SUSPENSION, [
      inactiveFor(30),
      inactiveFor(30, { id: secondTenantId }),
    ]);
    vi.mocked(requestTenantCacheInvalidation).mockRejectedValueOnce(
      new Error(MOCK_CACHE_DOWN),
    );

    await expect(sweep()).resolves.toEqual({
      ...NO_STAGE_ADVANCED,
      [INACTIVITY_STAGE.SUSPENSION]: 1,
    });
    expect(logger.error).toHaveBeenCalledWith(
      INACTIVITY_SWEEP_LOG.STAGE_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        stage: INACTIVITY_STAGE.SUSPENSION,
        error: MOCK_CACHE_DOWN,
      },
    );
    const [lastInvalidation] =
      vi.mocked(requestTenantCacheInvalidation).mock.lastCall ?? [];
    expect(lastInvalidation?.tenantId).toBe(secondTenantId);
  });
});
