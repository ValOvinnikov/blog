import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_OWNER_EMAIL } from '@blog/db/constants';
import {
  claimTenantOwnerEmail,
  releaseTenantOwnerEmail,
} from '@blog/db/queries/tenants';
import { sendEmail } from '@blog/email';
import { DEFAULT_OWNER_EMAIL_FROM_ADDRESS } from '@worker/constants/owner-email';
import {
  OWNER_EMAIL,
  SANITY_PROJECT_ID,
} from '@worker/testing/owner-access/fixtures';
import { getProvisionEnv } from '@worker/testing/provision-env/fake-provision-env';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import type { TOwnerAccessTarget } from '@worker/utils/owner-access/owner-access-target';

import { OWNER_EMAIL_COPY } from './owner-email-copy';
import { sendOwnerEmailOnce, sendPendingOwnerEmails } from './send-owner-email';

const CLAIMED_AT = new Date('2026-10-21T09:00:00.000Z');
const TWO_DAYS_AGO = new Date(Date.now() - 2 * 24 * 60 * 60_000);
const SEND_FAILED_EVENT = 'owner_email.send_failed';
const AN_HOUR_AGO = new Date(Date.now() - 60 * 60_000);

vi.mock('@worker/utils/logger/logger');
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);
vi.mock(import('@blog/email'), async (importOriginal) => ({
  ...(await importOriginal()),
  sendEmail: vi.fn(),
}));

function makeTarget(
  overrides: Parameters<typeof makeTenant>[0] = {},
): TOwnerAccessTarget {
  return {
    tenant: makeTenant({ sanityProjectId: SANITY_PROJECT_ID, ...overrides }),
    projectId: SANITY_PROJECT_ID,
    ownerEmail: OWNER_EMAIL,
    env: getProvisionEnv(),
  };
}

function sentEmails() {
  return vi.mocked(sendEmail).mock.calls.map(([input]) => input);
}

describe(sendOwnerEmailOnce, () => {
  beforeEach(() => {
    vi.mocked(claimTenantOwnerEmail).mockResolvedValue(CLAIMED_AT);
    vi.mocked(sendEmail).mockResolvedValue();
  });

  it('claims the email for the tenant before sending it to the owner', async () => {
    await sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.SITE_READY);

    expect(claimTenantOwnerEmail).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      TENANT_OWNER_EMAIL.SITE_READY,
    );
    expect(sentEmails()).toEqual([
      expect.objectContaining({
        to: OWNER_EMAIL,
        from: DEFAULT_OWNER_EMAIL_FROM_ADDRESS,
      }),
    ]);
  });

  it('sends nothing when the email was already claimed', async () => {
    vi.mocked(claimTenantOwnerEmail).mockResolvedValue(null);

    await sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.SITE_READY);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("writes the email in the site's default language", async () => {
    const target = makeTarget({ locale: LOCALE_ISO_CODES.FR });

    await sendOwnerEmailOnce(target, TENANT_OWNER_EMAIL.SITE_READY);

    const { subject } = OWNER_EMAIL_COPY.FR.siteReady({
      siteName: target.tenant.name,
      siteUrl: `https://${target.tenant.primaryDomain}`,
      ownerEmail: OWNER_EMAIL,
    });
    expect(sentEmails()).toEqual([expect.objectContaining({ subject })]);
  });

  it('links the nudge to the admin dashboard', async () => {
    await sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.INVITE_NUDGE);

    expect(sentEmails()[0]?.html).toContain(
      'href="https://admin.example.com/dashboard"',
    );
  });

  it('links site ready to the Studio', async () => {
    await sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.SITE_READY);

    expect(sentEmails()[0]?.html).toContain(
      'href="https://admin.example.com/dashboard/studio"',
    );
  });

  describe('when the send fails', () => {
    beforeEach(() => {
      vi.mocked(sendEmail).mockRejectedValue(new Error('Resend is down'));
    });

    it('logs the failure without throwing', async () => {
      await expect(
        sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        SEND_FAILED_EVENT,
        expect.objectContaining({
          tenantId: TEST_TENANT_ID,
          email: TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
        }),
      );
    });

    it('releases its claim so a later check retries the send', async () => {
      await sendOwnerEmailOnce(
        makeTarget(),
        TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
      );

      expect(releaseTenantOwnerEmail).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
        CLAIMED_AT,
      );
    });

    it('logs a release that fails without throwing', async () => {
      vi.mocked(releaseTenantOwnerEmail).mockRejectedValue(new Error('503'));

      await expect(
        sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        'owner_email.release_failed',
        expect.objectContaining({ tenantId: TEST_TENANT_ID }),
      );
    });
  });

  it('logs a claim that fails without sending or releasing', async () => {
    vi.mocked(claimTenantOwnerEmail).mockRejectedValue(new Error('503'));

    await expect(
      sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.SITE_READY),
    ).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(releaseTenantOwnerEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      SEND_FAILED_EVENT,
      expect.objectContaining({ tenantId: TEST_TENANT_ID }),
    );
  });
});

describe(sendPendingOwnerEmails, () => {
  beforeEach(() => {
    vi.mocked(claimTenantOwnerEmail).mockResolvedValue(CLAIMED_AT);
    vi.mocked(sendEmail).mockResolvedValue();
  });

  function claimedEmails() {
    return vi
      .mocked(claimTenantOwnerEmail)
      .mock.calls.map(([, email]) => email);
  }

  it('retries a heads-up that has not gone out yet', async () => {
    await sendPendingOwnerEmails(
      makeTarget({ ownerInviteSentAt: AN_HOUR_AGO }),
    );

    expect(claimedEmails()).toEqual([TENANT_OWNER_EMAIL.INVITE_HEADS_UP]);
  });

  it('sends nothing within a day of a heads-up that went out', async () => {
    await sendPendingOwnerEmails(
      makeTarget({
        ownerInviteSentAt: AN_HOUR_AGO,
        ownerInviteHeadsUpSentAt: AN_HOUR_AGO,
      }),
    );

    expect(claimTenantOwnerEmail).not.toHaveBeenCalled();
  });

  it('nudges an owner who has not accepted a day after the invite', async () => {
    await sendPendingOwnerEmails(
      makeTarget({
        ownerInviteSentAt: TWO_DAYS_AGO,
        ownerInviteHeadsUpSentAt: TWO_DAYS_AGO,
      }),
    );

    expect(claimedEmails()).toEqual([TENANT_OWNER_EMAIL.INVITE_NUDGE]);
  });

  it('never nudges twice', async () => {
    await sendPendingOwnerEmails(
      makeTarget({
        ownerInviteSentAt: TWO_DAYS_AGO,
        ownerInviteHeadsUpSentAt: TWO_DAYS_AGO,
        ownerInviteNudgeSentAt: AN_HOUR_AGO,
      }),
    );

    expect(claimTenantOwnerEmail).not.toHaveBeenCalled();
  });
});
