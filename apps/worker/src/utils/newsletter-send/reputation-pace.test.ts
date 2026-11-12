import {
  EMAIL_REPUTATION_LEVEL,
  EMAIL_REPUTATION_THRESHOLDS,
} from '@blog/db/constants';
import { pauseNewsletter } from '@blog/db/queries/email-config';
import {
  getEmailReputation,
  type IEmailReputation,
} from '@blog/db/queries/email-usage';
import { NEWSLETTER_SEND_PACE } from '@worker/constants/newsletter-send';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { sendOperatorEmail } from '@worker/utils/operator-email/send-operator-email';

import { readReputationPace } from './reputation-pace';

vi.mock('@blog/db/queries/email-config');
vi.mock('@blog/db/queries/email-usage');
vi.mock('@worker/utils/env/env');
vi.mock('@worker/utils/operator-email/send-operator-email');

const MOCK_TENANT = mockTenant();
const MOCK_PLATFORM_URL = 'https://admin.example.com';
const { WARN, SLOW, STOP } = EMAIL_REPUTATION_LEVEL;
const BOUNCE = EMAIL_REPUTATION_THRESHOLDS.bounceRate;

function reputationOf(bounceRate: number): IEmailReputation {
  return { resolvedCount: 500, bounceRate, complaintRate: 0 };
}

describe(readReputationPace, () => {
  beforeEach(() => {
    mockEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_URL;
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

  it('pauses the site and alerts the operator at the stop level', async () => {
    vi.mocked(getEmailReputation).mockResolvedValue(reputationOf(BOUNCE[STOP]));

    await expect(
      readReputationPace(MOCK_TENANT, { isOperatorAlerted: false }),
    ).resolves.toBe(NEWSLETTER_SEND_PACE.STOPPED);
    expect(pauseNewsletter).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(sendOperatorEmail).toHaveBeenCalledOnce();
  });
});
