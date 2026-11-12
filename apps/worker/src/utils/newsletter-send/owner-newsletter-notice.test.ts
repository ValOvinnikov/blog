import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_SKIP_REASON,
} from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import {
  markNewsletterLimitNoticeSent,
  releaseNewsletterLimitNotice,
} from '@blog/db/queries/newsletter-post-sends';
import { EMAIL_ACCOUNT, sendEmail } from '@blog/email';
import { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import { mockNewsletterLimits } from '@worker/testing/newsletter-send/fixtures';
import { MOCK_RESEND_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_OWNER_EMAIL } from '@worker/testing/owner-access/fixtures';
import { MOCK_PLATFORM_APP_BASE_URL } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';

import { sendOwnerNewsletterNotice } from './owner-newsletter-notice';

vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/queries/newsletter-post-sends');
vi.mock('@blog/email/transport/send-email');
vi.mock('@worker/utils/env/env');

const { SENDING_PAUSED, SUBSCRIBER_BAND_NEAR } = NEWSLETTER_LIMIT_NOTICE_KIND;
const MOCK_LIMITS = mockNewsletterLimits({ activeCount: 1_001 });

function sentEmail() {
  return vi.mocked(sendEmail).mock.calls[0]?.[0];
}

describe(sendOwnerNewsletterNotice, () => {
  beforeEach(() => {
    mockEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
    vi.mocked(markNewsletterLimitNoticeSent).mockResolvedValue(true);
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
  });

  it('emails the owner from the platform account, linking to their dashboard', async () => {
    await sendOwnerNewsletterNotice(
      mockTenant(),
      SUBSCRIBER_BAND_NEAR,
      MOCK_LIMITS,
    );

    expect(markNewsletterLimitNoticeSent).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      SUBSCRIBER_BAND_NEAR,
    );
    expect(sentEmail()).toMatchObject({
      account: EMAIL_ACCOUNT.PLATFORM,
      to: MOCK_OWNER_EMAIL,
    });
    expect(sentEmail()?.html).toContain(MOCK_PLATFORM_APP_BASE_URL);
  });

  it('writes numbers and the percentage the way the owner’s language does', async () => {
    await sendOwnerNewsletterNotice(
      mockTenant({ locale: LOCALE_ISO_CODES.DE }),
      SUBSCRIBER_BAND_NEAR,
      MOCK_LIMITS,
    );

    expect(sentEmail()?.text).toContain('1.001');
    expect(sentEmail()?.text).toMatch(/80\s%/);
  });

  it('switches language with the site', async () => {
    await sendOwnerNewsletterNotice(
      mockTenant(),
      SENDING_PAUSED,
      MOCK_LIMITS,
      NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
    );
    await sendOwnerNewsletterNotice(
      mockTenant({ locale: LOCALE_ISO_CODES.DE }),
      SENDING_PAUSED,
      MOCK_LIMITS,
      NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
    );

    const [english, german] = vi
      .mocked(sendEmail)
      .mock.calls.map(([input]) => input.subject);
    expect(german).not.toBe(english);
  });

  it('sends nothing when this month’s notice of that kind was already sent', async () => {
    vi.mocked(markNewsletterLimitNoticeSent).mockResolvedValue(false);

    await sendOwnerNewsletterNotice(mockTenant(), SENDING_PAUSED, MOCK_LIMITS);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('gives the month’s notice back when the send fails, and logs it', async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error(MOCK_RESEND_DOWN));

    await sendOwnerNewsletterNotice(mockTenant(), SENDING_PAUSED, MOCK_LIMITS);

    expect(releaseNewsletterLimitNotice).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      SENDING_PAUSED,
    );
    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_SEND_LOG.OWNER_EMAIL_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        kind: SENDING_PAUSED,
        error: MOCK_RESEND_DOWN,
      },
    );
  });

  it('claims nothing when the site has no owner address', async () => {
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(undefined);

    await sendOwnerNewsletterNotice(mockTenant(), SENDING_PAUSED, MOCK_LIMITS);

    expect(markNewsletterLimitNoticeSent).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
