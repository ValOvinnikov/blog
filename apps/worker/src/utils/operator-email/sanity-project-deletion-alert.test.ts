import { listSuperadminEmails } from '@blog/db/queries/admins';
import { sendEmail } from '@blog/email';
import {
  DEPROVISIONING_ALERT_NO_RECIPIENTS_EVENT,
  DEPROVISIONING_ALERT_SEND_FAILED_EVENT,
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

const ARCHIVED_TENANT = mockProvisionedTenant();

vi.mock('@worker/utils/env/env');
vi.mock('@blog/db/queries/admins');
vi.mock('@blog/email/transport/send-email');

function sentTo(): string[] {
  return vi.mocked(sendEmail).mock.calls.map(([input]) => input.to);
}

describe(alertOperatorsToDeleteSanityProject, () => {
  beforeEach(() => {
    vi.mocked(listSuperadminEmails).mockResolvedValue(MOCK_SUPERADMIN_EMAILS);
    vi.mocked(sendEmail).mockResolvedValue();
  });

  it('emails every super admin the project to delete in Sanity Manage', async () => {
    await alertOperatorsToDeleteSanityProject(ARCHIVED_TENANT);

    const [email] = vi.mocked(sendEmail).mock.calls.map(([input]) => input);
    expect(sentTo()).toEqual(MOCK_SUPERADMIN_EMAILS);
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

    await alertOperatorsToDeleteSanityProject(ARCHIVED_TENANT);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      DEPROVISIONING_ALERT_NO_RECIPIENTS_EVENT,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('logs a failed send and still sends the rest', async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error(MOCK_RESEND_DOWN));

    await alertOperatorsToDeleteSanityProject(ARCHIVED_TENANT);

    expect(sentTo()).toEqual(MOCK_SUPERADMIN_EMAILS);
    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_ALERT_SEND_FAILED_EVENT,
      { tenantId: MOCK_TENANT_ID, error: MOCK_RESEND_DOWN },
    );
  });
});
