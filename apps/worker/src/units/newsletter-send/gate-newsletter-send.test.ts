import { CAPABILITY, TENANT_PLAN } from '@shinefold/config/constants';
import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/db/constants';
import { getNewsletterPausedAt } from '@shinefold/db/queries/email-config';
import { countEmailSendsThisMonth } from '@shinefold/db/queries/email-usage';
import { markNewsletterPostSkipped } from '@shinefold/db/queries/newsletter-post-sends';
import { countActiveSubscribers } from '@shinefold/db/queries/subscribers';
import { listResolvableEntitlementGrants } from '@shinefold/db/queries/tenant-entitlement-grants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { mockEntitlementGrant } from '@shinefold/db/testing/tenant-entitlement-grants/mock-entitlement-grant';
import { isEmailAccountConfigured } from '@shinefold/email';
import {
  NEWSLETTER_SEND_GATE,
  NEWSLETTER_SEND_LOG,
  NEWSLETTER_SEND_PACE,
} from '@worker/constants/newsletter-send';
import {
  MOCK_UNSUBSCRIBE_KEY,
  mockNewsletterLimits,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { sendOwnerNewsletterNotice } from '@worker/utils/newsletter-send/owner-newsletter-notice';
import { readNewsletterLimits } from '@worker/utils/newsletter-send/read-newsletter-limits';
import { readReputationPace } from '@worker/utils/newsletter-send/reputation-pace';

import { gateNewsletterSend } from './gate-newsletter-send';

vi.mock('@shinefold/db/queries/email-config');
vi.mock('@shinefold/db/queries/email-usage');
vi.mock('@shinefold/db/queries/newsletter-post-sends');
vi.mock('@shinefold/db/queries/subscribers');
vi.mock('@shinefold/db/queries/tenant-entitlement-grants');
vi.mock('@shinefold/db/queries/tenants');
vi.mock('@shinefold/email/transport/send-email');
vi.mock('@worker/utils/env/env');
vi.mock('@worker/utils/newsletter-send/read-newsletter-limits', {
  spy: true,
});
vi.mock('@worker/utils/newsletter-send/owner-newsletter-notice');
vi.mock('@worker/utils/newsletter-send/reputation-pace');

const MOCK_TENANT = mockTenant();
const SKIPPED = { gate: NEWSLETTER_SEND_GATE.SKIPPED };

function runGate() {
  return gateNewsletterSend(MOCK_TENANT_ID, MOCK_POST_ID);
}

describe(gateNewsletterSend, () => {
  beforeEach(() => {
    mockEnv.NEWSLETTER_UNSUBSCRIBE_KEY = MOCK_UNSUBSCRIBE_KEY;
    vi.mocked(isEmailAccountConfigured).mockReturnValue(true);
    vi.mocked(getTenantById).mockResolvedValue(MOCK_TENANT);
    vi.mocked(getNewsletterPausedAt).mockResolvedValue(undefined);
    vi.mocked(readReputationPace).mockResolvedValue(
      NEWSLETTER_SEND_PACE.NORMAL,
    );
    vi.mocked(readNewsletterLimits).mockResolvedValue(mockNewsletterLimits());
  });

  it('lets a site within its limits send at the pace its reputation allows', async () => {
    vi.mocked(readReputationPace).mockResolvedValue(NEWSLETTER_SEND_PACE.SLOW);

    await expect(runGate()).resolves.toEqual({
      gate: NEWSLETTER_SEND_GATE.SEND,
      pace: NEWSLETTER_SEND_PACE.SLOW,
    });
    expect(readReputationPace).toHaveBeenCalledWith(MOCK_TENANT, {
      isOperatorAlerted: true,
    });
    expect(markNewsletterPostSkipped).not.toHaveBeenCalled();
    expect(sendOwnerNewsletterNotice).not.toHaveBeenCalled();
  });

  it.each([
    [
      'tenant mail has no key',
      NEWSLETTER_SEND_LOG.NO_TENANT_MAIL_KEY,
      () => vi.mocked(isEmailAccountConfigured).mockReturnValue(false),
    ],
    [
      'there is no unsubscribe key',
      NEWSLETTER_SEND_LOG.NO_UNSUBSCRIBE_KEY,
      () => {
        mockEnv.NEWSLETTER_UNSUBSCRIBE_KEY = undefined;
      },
    ],
  ])('refuses to start, and logs, when %s', async (_, event, arrange) => {
    arrange();

    await expect(runGate()).resolves.toEqual({
      gate: NEWSLETTER_SEND_GATE.NOT_CONFIGURED,
    });
    expect(logger.error).toHaveBeenCalledWith(event, {
      tenantId: MOCK_TENANT_ID,
      postId: MOCK_POST_ID,
    });
  });

  it('skips the post while an operator has not cleared the site’s pause', async () => {
    vi.mocked(getNewsletterPausedAt).mockResolvedValue(new Date());

    await expect(runGate()).resolves.toEqual(SKIPPED);
    expect(markNewsletterPostSkipped).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    );
    expect(readReputationPace).not.toHaveBeenCalled();
  });

  it('skips the post when the reputation gate stops the site', async () => {
    vi.mocked(readReputationPace).mockResolvedValue(
      NEWSLETTER_SEND_PACE.STOPPED,
    );

    await expect(runGate()).resolves.toEqual(SKIPPED);
    expect(markNewsletterPostSkipped).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
    );
  });

  it.each([
    [NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND, { activeCount: 1_001 }],
    [NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE, { sentThisMonth: 5_950 }],
  ])(
    'skips the post %s and tells the owner sending is paused',
    async (reason, overrides) => {
      const limits = mockNewsletterLimits(overrides);
      vi.mocked(readNewsletterLimits).mockResolvedValue(limits);

      await expect(runGate()).resolves.toEqual(SKIPPED);
      expect(markNewsletterPostSkipped).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        reason,
      );
      expect(sendOwnerNewsletterNotice).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT,
        NEWSLETTER_LIMIT_NOTICE_KIND.SENDING_PAUSED,
        limits,
        reason,
      );
    },
  );

  it('warns the owner about each limit this send takes past 80%', async () => {
    const limits = mockNewsletterLimits({
      activeCount: 900,
      sentThisMonth: 4_000,
    });
    vi.mocked(readNewsletterLimits).mockResolvedValue(limits);

    await runGate();

    expect(vi.mocked(sendOwnerNewsletterNotice).mock.calls).toEqual([
      [MOCK_TENANT, NEWSLETTER_LIMIT_NOTICE_KIND.SUBSCRIBER_BAND_NEAR, limits],
      [
        MOCK_TENANT,
        NEWSLETTER_LIMIT_NOTICE_KIND.MONTHLY_ALLOWANCE_NEAR,
        limits,
      ],
    ]);
  });

  describe('for a Starter site granted the newsletter', () => {
    beforeEach(() => {
      vi.mocked(readNewsletterLimits).mockReset();
      vi.mocked(getTenantById).mockResolvedValue(
        mockTenant({ plan: TENANT_PLAN.STARTER }),
      );
      vi.mocked(listResolvableEntitlementGrants).mockResolvedValue([
        mockEntitlementGrant({ key: CAPABILITY.NEWSLETTER }),
      ]);
      vi.mocked(countEmailSendsThisMonth).mockResolvedValue(0);
    });

    it.each([0, mockNewsletterLimits().activeCount])(
      'sends to %i subscribers without telling the owner anything',
      async (activeCount) => {
        vi.mocked(countActiveSubscribers).mockResolvedValue(activeCount);

        await expect(runGate()).resolves.toEqual({
          gate: NEWSLETTER_SEND_GATE.SEND,
          pace: NEWSLETTER_SEND_PACE.NORMAL,
        });
        expect(markNewsletterPostSkipped).not.toHaveBeenCalled();
        expect(sendOwnerNewsletterNotice).not.toHaveBeenCalled();
      },
    );
  });
});
