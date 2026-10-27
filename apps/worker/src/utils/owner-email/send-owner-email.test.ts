import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { DAY_MS, TENANT_OWNER_EMAIL } from '@blog/db/constants';
import {
  claimTenantOwnerEmail,
  releaseTenantOwnerEmail,
} from '@blog/db/queries/tenants';
import { sendEmail } from '@blog/email';
import {
  DEFAULT_OWNER_EMAIL_FROM_ADDRESS,
  OWNER_EMAIL_RELEASE_FAILED_EVENT,
  OWNER_EMAIL_SEND_FAILED_EVENT,
} from '@worker/constants/owner-email';
import { freezeClock, MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import {
  MOCK_DB_DOWN,
  MOCK_RESEND_DOWN,
} from '@worker/testing/outage/fixtures';
import {
  mockOwnerAccessTarget,
  MOCK_OWNER_EMAIL,
} from '@worker/testing/owner-access/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import type { TOwnerAccessTarget } from '@worker/utils/owner-access/owner-access-target';

import { OWNER_EMAIL_COPY } from './owner-email-copy';
import { sendOwnerEmailOnce, sendPendingOwnerEmails } from './send-owner-email';

const CLAIMED_AT = MOCK_NOW;
const TWO_DAYS_AGO = new Date(MOCK_NOW.getTime() - 2 * DAY_MS);
const AN_HOUR_AGO = new Date(MOCK_NOW.getTime() - DAY_MS / 24);
const { platformAppBaseUrl } = MOCK_PROVISION_ENV;

vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/email/transport/send-email');

function makeTarget(
  overrides: Parameters<typeof mockProvisionedTenant>[0] = {},
): TOwnerAccessTarget {
  return mockOwnerAccessTarget(mockProvisionedTenant(overrides));
}

beforeEach(() => {
  freezeClock();
});

afterEach(() => {
  vi.useRealTimers();
});

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
      MOCK_TENANT_ID,
      TENANT_OWNER_EMAIL.SITE_READY,
    );
    const emails = sentEmails();
    const [email] = emails;
    expect(emails).toHaveLength(1);
    expect(email?.to).toBe(MOCK_OWNER_EMAIL);
    expect(email?.from).toBe(DEFAULT_OWNER_EMAIL_FROM_ADDRESS);
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
      ownerEmail: MOCK_OWNER_EMAIL,
    });
    const [email] = sentEmails();
    expect(email?.subject).toBe(subject);
  });

  it.each([
    [TENANT_OWNER_EMAIL.INVITE_NUDGE, '/dashboard'],
    [TENANT_OWNER_EMAIL.SITE_READY, '/dashboard/studio'],
  ])('links the %s email to the admin %s', async (email, path) => {
    await sendOwnerEmailOnce(makeTarget(), email);

    expect(sentEmails()[0]?.html).toContain(
      `href="${platformAppBaseUrl}${path}"`,
    );
  });

  describe('when the send fails', () => {
    beforeEach(() => {
      vi.mocked(sendEmail).mockRejectedValue(new Error(MOCK_RESEND_DOWN));
    });

    it('logs the failure without throwing', async () => {
      await expect(
        sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(OWNER_EMAIL_SEND_FAILED_EVENT, {
        tenantId: MOCK_TENANT_ID,
        email: TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
        error: MOCK_RESEND_DOWN,
      });
    });

    it('releases its claim so a later check retries the send', async () => {
      await sendOwnerEmailOnce(
        makeTarget(),
        TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
      );

      expect(releaseTenantOwnerEmail).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
        CLAIMED_AT,
      );
    });

    it('logs a release that fails without throwing', async () => {
      vi.mocked(releaseTenantOwnerEmail).mockRejectedValue(
        new Error(MOCK_DB_DOWN),
      );

      await expect(
        sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        OWNER_EMAIL_RELEASE_FAILED_EVENT,
        {
          tenantId: MOCK_TENANT_ID,
          email: TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
          error: MOCK_DB_DOWN,
        },
      );
    });
  });

  it('logs a claim that fails without sending or releasing', async () => {
    vi.mocked(claimTenantOwnerEmail).mockRejectedValue(new Error(MOCK_DB_DOWN));

    await expect(
      sendOwnerEmailOnce(makeTarget(), TENANT_OWNER_EMAIL.SITE_READY),
    ).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(releaseTenantOwnerEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(OWNER_EMAIL_SEND_FAILED_EVENT, {
      tenantId: MOCK_TENANT_ID,
      email: TENANT_OWNER_EMAIL.SITE_READY,
      error: MOCK_DB_DOWN,
    });
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
