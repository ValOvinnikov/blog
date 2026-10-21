import type { TMaybeUndefined } from '@blog/config';
import { listSuperadminEmails } from '@blog/db/queries/admins';
import { sendEmail } from '@blog/email';
import {
  DEFAULT_OPERATOR_ALERT_FROM_ADDRESS,
  DEPROVISIONING_ALERT_NO_RECIPIENTS_EVENT,
  DEPROVISIONING_ALERT_SEND_FAILED_EVENT,
  SANITY_MANAGE_PROJECT_URL,
} from '@worker/constants/deprovisioning';
import { SANITY_PROJECT_ID } from '@worker/testing/owner-access/fixtures';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { alertOperatorsToDeleteSanityProject } from './sanity-project-deletion-alert';

const ARCHIVED_TENANT = makeTenant({ sanityProjectId: SANITY_PROJECT_ID });
const RESEND_DOWN = 'resend down';
const SUPERADMINS = [
  'first-superadmin@example.com',
  'second-superadmin@example.com',
];

const mockEnv = vi.hoisted((): Record<string, TMaybeUndefined<string>> => ({}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));
vi.mock('@worker/utils/logger/logger');
vi.mock('@blog/db/queries/admins');
vi.mock(import('@blog/email'), async (importOriginal) => ({
  ...(await importOriginal()),
  sendEmail: vi.fn(),
}));

function sentTo(): string[] {
  return vi.mocked(sendEmail).mock.calls.map(([input]) => input.to);
}

describe(alertOperatorsToDeleteSanityProject, () => {
  beforeEach(() => {
    vi.mocked(listSuperadminEmails).mockResolvedValue(SUPERADMINS);
    vi.mocked(sendEmail).mockResolvedValue();
  });

  it('sends every super admin one email naming the project to delete in Sanity Manage', async () => {
    await alertOperatorsToDeleteSanityProject(ARCHIVED_TENANT);

    expect(sentTo()).toEqual(SUPERADMINS);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: DEFAULT_OPERATOR_ALERT_FROM_ADDRESS,
        html: expect.stringContaining(
          `href="${SANITY_MANAGE_PROJECT_URL}${SANITY_PROJECT_ID}"`,
        ),
      }),
    );
  });

  it('sends nothing for a tenant without a Sanity project', async () => {
    await alertOperatorsToDeleteSanityProject(makeTenant());

    expect(listSuperadminEmails).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('warns when there is no super admin to tell', async () => {
    vi.mocked(listSuperadminEmails).mockResolvedValue([]);

    await alertOperatorsToDeleteSanityProject(ARCHIVED_TENANT);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      DEPROVISIONING_ALERT_NO_RECIPIENTS_EVENT,
      { tenantId: TEST_TENANT_ID },
    );
  });

  it('logs a failed send and still sends the rest', async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error(RESEND_DOWN));

    await alertOperatorsToDeleteSanityProject(ARCHIVED_TENANT);

    expect(sentTo()).toEqual(SUPERADMINS);
    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_ALERT_SEND_FAILED_EVENT,
      { tenantId: TEST_TENANT_ID, error: RESEND_DOWN },
    );
  });
});
