import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_SKIP_REASON,
} from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { markNewsletterLimitNoticeSent } from '@blog/db/queries/newsletter-post-sends';
import { EMAIL_ACCOUNT, sendEmail } from '@blog/email';
import { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import { mockNewsletterLimits } from '@worker/testing/newsletter-send/fixtures';
import { MOCK_RESEND_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';

import { sendOwnerNewsletterNotice } from './owner-newsletter-notice';
import { OWNER_NEWSLETTER_PAUSED_COPY } from './owner-newsletter-paused-copy';

vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/queries/newsletter-post-sends');
vi.mock('@blog/email/transport/send-email');
vi.mock('@worker/utils/env/env');

const MOCK_OWNER_EMAIL = 'owner@acme.example.com';
const MOCK_PLATFORM_URL = 'https://admin.example.com';
const { SENDING_PAUSED, SUBSCRIBER_BAND_NEAR } = NEWSLETTER_LIMIT_NOTICE_KIND;
const MOCK_LIMITS = mockNewsletterLimits({ activeCount: 1_001 });

describe(sendOwnerNewsletterNotice, () => {
  beforeEach(() => {
    mockEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_URL;
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
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        account: EMAIL_ACCOUNT.PLATFORM,
        to: MOCK_OWNER_EMAIL,
      }),
    );
    expect(vi.mocked(sendEmail).mock.calls[0]?.[0].html).toContain(
      MOCK_PLATFORM_URL,
    );
  });

  it('writes in the owner’s site language', async () => {
    const tenant = mockTenant({ locale: LOCALE_ISO_CODES.DE });

    await sendOwnerNewsletterNotice(
      tenant,
      SENDING_PAUSED,
      MOCK_LIMITS,
      NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
    );

    expect(vi.mocked(sendEmail).mock.calls[0]?.[0].subject).toBe(
      OWNER_NEWSLETTER_PAUSED_COPY[LOCALE_ISO_CODES.DE][SENDING_PAUSED]({
        siteName: tenant.name,
        activeCount: '1.001',
        bandCeiling: '1.000',
        allowance: '6.000',
        sentAfterThisPost: '1.001',
        isOverBand: true,
      }).subject,
    );
  });

  it('sends nothing when this month’s notice of that kind was already sent', async () => {
    vi.mocked(markNewsletterLimitNoticeSent).mockResolvedValue(false);

    await sendOwnerNewsletterNotice(mockTenant(), SENDING_PAUSED, MOCK_LIMITS);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('logs a failed send without throwing', async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error(MOCK_RESEND_DOWN));

    await sendOwnerNewsletterNotice(mockTenant(), SENDING_PAUSED, MOCK_LIMITS);

    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_SEND_LOG.OWNER_EMAIL_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        kind: SENDING_PAUSED,
        error: MOCK_RESEND_DOWN,
      },
    );
  });
});
