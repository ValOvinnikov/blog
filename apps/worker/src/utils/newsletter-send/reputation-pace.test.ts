import {
  EMAIL_REPUTATION_LEVEL,
  EMAIL_REPUTATION_THRESHOLDS,
} from '@shinefold/db/constants';
import { pauseNewsletter } from '@shinefold/db/queries/email-config';
import {
  getEmailReputation,
  type IEmailReputation,
} from '@shinefold/db/queries/email-usage';
import { NEWSLETTER_SEND_PACE } from '@worker/constants/newsletter-send';
import { MOCK_PAUSED_AT } from '@worker/testing/newsletter-send/fixtures';
import { MOCK_PLATFORM_APP_BASE_URL } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { sendOwnerReputationPauseNotice } from '@worker/utils/newsletter-send/owner-newsletter-notice';
import { sendOperatorEmail } from '@worker/utils/operator-email/send-operator-email';

import { readReputationPace } from './reputation-pace';

vi.mock('@shinefold/db/queries/email-config');
vi.mock('@shinefold/db/queries/email-usage');
vi.mock('@worker/utils/env/env');
vi.mock('@worker/utils/newsletter-send/owner-newsletter-notice');
vi.mock('@worker/utils/operator-email/send-operator-email');

const MOCK_TENANT = mockTenant();
const { WARN, SLOW, STOP } = EMAIL_REPUTATION_LEVEL;
const BOUNCE = EMAIL_REPUTATION_THRESHOLDS.bounceRate;

function reputationOf(bounceRate: number): IEmailReputation {
  return { resolvedCount: 500, bounceRate, complaintRate: 0 };
}

describe(readReputationPace, () => {
  beforeEach(() => {
    mockEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
  });

  it('sends normally and alerts nobody while the rates are healthy', async () => {
    vi.mocked(getEmailReputation).mockResolvedValue(reputationOf(0));

    await expect(
      readReputationPace(MOCK_TENANT, { isOperatorAlerted: true }),
    ).resolves.toBe(NEWSLETTER_SEND_PACE.NORMAL);
    expect(sendOperatorEmail).not.toHaveBeenCalled();
  });

  describe('at the warn level', () => {
    beforeEach(() => {
      vi.mocked(getEmailReputation).mockResolvedValue(
        reputationOf(BOUNCE[WARN]),
      );
    });

    it('alerts the operator when asked to, and keeps sending', async () => {
      await expect(
        readReputationPace(MOCK_TENANT, { isOperatorAlerted: true }),
      ).resolves.toBe(NEWSLETTER_SEND_PACE.NORMAL);
      expect(sendOperatorEmail).toHaveBeenCalledOnce();
      expect(pauseNewsletter).not.toHaveBeenCalled();
      expect(sendOwnerReputationPauseNotice).not.toHaveBeenCalled();
    });

    it('does not repeat the warning when told not to', async () => {
      await readReputationPace(MOCK_TENANT, { isOperatorAlerted: false });

      expect(sendOperatorEmail).not.toHaveBeenCalled();
    });
  });

  it('slows the site at the slow level', async () => {
    vi.mocked(getEmailReputation).mockResolvedValue(reputationOf(BOUNCE[SLOW]));

    await expect(
      readReputationPace(MOCK_TENANT, { isOperatorAlerted: true }),
    ).resolves.toBe(NEWSLETTER_SEND_PACE.SLOW);
  });

  it('pauses the site and alerts the operator and the owner at the stop level', async () => {
    vi.mocked(getEmailReputation).mockResolvedValue(reputationOf(BOUNCE[STOP]));
    vi.mocked(pauseNewsletter).mockResolvedValue(MOCK_PAUSED_AT);

    await expect(
      readReputationPace(MOCK_TENANT, { isOperatorAlerted: false }),
    ).resolves.toBe(NEWSLETTER_SEND_PACE.STOPPED);
    expect(pauseNewsletter).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(sendOperatorEmail).toHaveBeenCalledOnce();
    expect(sendOwnerReputationPauseNotice).toHaveBeenCalledWith(
      MOCK_TENANT,
      MOCK_PAUSED_AT,
    );
  });
});
