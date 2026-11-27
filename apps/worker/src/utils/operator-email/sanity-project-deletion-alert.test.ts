import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { listSuperadminEmails } from '@shinefold/db/queries/admins';
import { sendEmail } from '@shinefold/email';
import {
  DEPROVISIONING_LOG,
  SANITY_MANAGE_PROJECT_URL,
} from '@worker/constants/deprovisioning';
import { DEFAULT_OPERATOR_ALERT_FROM_ADDRESS } from '@worker/constants/operator-alert';
import { MOCK_SUPERADMIN_EMAILS } from '@worker/testing/operator-email/fixtures';
import { MOCK_RESEND_DOWN } from '@worker/testing/outage/fixtures';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { alertOperatorsToDeleteSanityProject } from './sanity-project-deletion-alert';

const MOCK_ARCHIVED_TENANT = mockProvisionedTenant();

vi.mock('@worker/utils/env/env');
vi.mock('@shinefold/db/queries/admins');
vi.mock('@shinefold/email/transport/send-email');

function sentTo(): string[] {
  return vi.mocked(sendEmail).mock.calls.map(([input]) => input.to);
}

describe(alertOperatorsToDeleteSanityProject, () => {
  beforeEach(() => {
    vi.mocked(listSuperadminEmails).mockResolvedValue(MOCK_SUPERADMIN_EMAILS);
    vi.mocked(sendEmail).mockResolvedValue();
  });

  it('emails every super admin the project to delete in Sanity Manage', async () => {
    await alertOperatorsToDeleteSanityProject(MOCK_ARCHIVED_TENANT);

    const [email] = vi.mocked(sendEmail).mock.calls.map(([input]) => input);
    expect(sentTo()).toEqual(MOCK_SUPERADMIN_EMAILS);
    expect(email?.account).toBe(EMAIL_ACCOUNT.PLATFORM);
    expect(email?.from).toBe(DEFAULT_OPERATOR_ALERT_FROM_ADDRESS);
    expect(email?.html).toContain(
      `href="${SANITY_MANAGE_PROJECT_URL}${MOCK_SANITY_PROJECT_ID}"`,
    );
  });

  it('sends nothing for a tenant without a Sanity project', async () => {
    await alertOperatorsToDeleteSanityProject(mockTenant());

    expect(listSuperadminEmails).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('warns when there is no super admin to tell', async () => {
    vi.mocked(listSuperadminEmails).mockResolvedValue([]);

    await alertOperatorsToDeleteSanityProject(MOCK_ARCHIVED_TENANT);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      DEPROVISIONING_LOG.ALERT_NO_RECIPIENTS,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('logs a failed send and still sends the rest', async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error(MOCK_RESEND_DOWN));

    await alertOperatorsToDeleteSanityProject(MOCK_ARCHIVED_TENANT);

    expect(sentTo()).toEqual(MOCK_SUPERADMIN_EMAILS);
    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_LOG.ALERT_SEND_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_RESEND_DOWN },
    );
  });
});
