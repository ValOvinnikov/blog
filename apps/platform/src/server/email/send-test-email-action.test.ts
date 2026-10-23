import {
  ACTION_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type * as BlogEmail from '@blog/email';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { loadTenantEmailBrand } from '@platform/server/email/load-tenant-email-brand';
import { takeTestEmailSend } from '@platform/server/email/test-email-rate-limit';
import { MOCK_TENANT_EMAIL_BRAND } from '@platform/testing/tenant-email-brand';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import {
  sendTestEmailAction,
  type TSendTestEmailInput,
} from './send-test-email-action';

const { getEmailConfigMock, getEmailTemplateMock, sendEmailMock } = vi.hoisted(
  () => ({
    getEmailConfigMock: vi.fn(),
    getEmailTemplateMock: vi.fn(),
    sendEmailMock: vi.fn(),
  }),
);

vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@platform/server/auth/auth');
vi.mock('@platform/server/email/load-tenant-email-brand');
vi.mock('@platform/server/email/test-email-rate-limit');
vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof BlogEmail>()),
  sendEmail: sendEmailMock,
}));

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const takeTestEmailSendMock = vi.mocked(takeTestEmailSend);

const REPLY_TO_ADDRESS = 'hello@acme.example';
const ADMIN_EMAIL = 'admin@example.com';

const INPUT: TSendTestEmailInput = {
  templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  copy: {
    subject: 'Connexion',
    body: [
      {
        _type: 'block',
        _key: 'k1',
        style: 'normal',
        markDefs: [],
        children: [{ _type: 'span', _key: 's1', text: 'Bonjour', marks: [] }],
      },
    ],
  },
  sender: {
    senderName: 'Acme Co',
    replyToAddress: REPLY_TO_ADDRESS,
    footerPostalAddress: '1 Rue de Paris',
  },
};

describe(sendTestEmailAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: MOCK_TENANT_ID, name: 'Acme Co' },
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'admin-1', email: ADMIN_EMAIL },
    });
    takeTestEmailSendMock.mockReset();
    takeTestEmailSendMock.mockReturnValue(true);
    vi.mocked(loadTenantEmailBrand).mockResolvedValue(MOCK_TENANT_EMAIL_BRAND);
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({ logoAssetUrl: undefined });
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
    vi.mocked(logger.error).mockReset();
  });

  it('emails the draft to the signed-in admin, marked as a test', async () => {
    const result = await sendTestEmailAction(MOCK_TENANT_ID, INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      to: ADMIN_EMAIL,
    });
    expect(requireTenantMembershipMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ADMIN_EMAIL,
        subject: '[Test] Connexion',
        replyTo: REPLY_TO_ADDRESS,
        from: expect.stringMatching(/^Acme Co </),
        html: expect.stringContaining('Bonjour'),
      }),
    );
  });

  it('refuses without sending once the admin hits the limit', async () => {
    takeTestEmailSendMock.mockReturnValue(false);

    const result = await sendTestEmailAction(MOCK_TENANT_ID, INPUT);

    expect(takeTestEmailSendMock).toHaveBeenCalledWith('admin-1');
    expect(result).toEqual({ outcome: ACTION_OUTCOME.RATE_LIMITED });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('rejects a blank subject without reaching the tenant gate', async () => {
    const result = await sendTestEmailAction(MOCK_TENANT_ID, {
      ...INPUT,
      copy: { ...INPUT.copy, subject: null },
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('rejects a body carrying an unsafe link', async () => {
    const result = await sendTestEmailAction(MOCK_TENANT_ID, {
      ...INPUT,
      copy: {
        ...INPUT.copy,
        body: [
          {
            _type: 'block',
            _key: 'k1',
            markDefs: [{ _type: 'link', _key: 'l1', href: 'javascript:x' }],
            children: [],
          },
        ],
      },
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('reports and logs a failed send without throwing', async () => {
    sendEmailMock.mockRejectedValue(new Error('resend down'));

    const result = await sendTestEmailAction(MOCK_TENANT_ID, INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      'email_test.send_failed',
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('propagates the tenant gate when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(sendTestEmailAction(MOCK_TENANT_ID, INPUT)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
