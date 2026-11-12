import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_SKIP_REASON,
} from '@blog/db/constants';
import { getNewsletterPausedAt } from '@blog/db/queries/email-config';
import { markNewsletterPostSkipped } from '@blog/db/queries/newsletter-post-sends';
import { getTenantById } from '@blog/db/queries/tenants';
import { isEmailAccountConfigured } from '@blog/email';
import {
  NEWSLETTER_SEND_GATE,
  NEWSLETTER_SEND_LOG,
  NEWSLETTER_SEND_PACE,
} from '@worker/constants/newsletter-send';
import {
  MOCK_POST_ID,
  MOCK_UNSUBSCRIBE_KEY,
  mockNewsletterLimits,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { sendOwnerNewsletterNotice } from '@worker/utils/newsletter-send/owner-newsletter-notice';
import { readNewsletterLimits } from '@worker/utils/newsletter-send/read-newsletter-limits';
import { readReputationPace } from '@worker/utils/newsletter-send/reputation-pace';

import { gateNewsletterSend } from './gate-newsletter-send';

vi.mock('@blog/db/queries/email-config');
vi.mock('@blog/db/queries/newsletter-post-sends');
vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/email/transport/send-email');
vi.mock('@worker/utils/env/env');
vi.mock('@worker/utils/newsletter-send/read-newsletter-limits');
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

  it('refuses to start, and logs, when tenant mail has no key', async () => {
    vi.mocked(isEmailAccountConfigured).mockReturnValue(false);

    await expect(runGate()).resolves.toEqual({
      gate: NEWSLETTER_SEND_GATE.NOT_CONFIGURED,
    });
    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_SEND_LOG.NOT_CONFIGURED,
      {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
      },
    );
  });

  it('refuses to start without the unsubscribe key', async () => {
    mockEnv.NEWSLETTER_UNSUBSCRIBE_KEY = undefined;

    await expect(runGate()).resolves.toEqual({
      gate: NEWSLETTER_SEND_GATE.NOT_CONFIGURED,
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
});
