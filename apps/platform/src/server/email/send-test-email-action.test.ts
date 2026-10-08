import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { loadTenantEmailBrand } from '@platform/server/email/load-tenant-email-brand';
import { takeTestEmailSend } from '@platform/server/email/test-email-rate-limit';
import { TENANT_EMAIL_BRAND } from '@platform/testing/tenant-email-brand';
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
vi.mock('@platform/utils/logger/logger');
vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/email')>()),
  sendEmail: sendEmailMock,
}));

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const takeTestEmailSendMock = vi.mocked(takeTestEmailSend);

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
    replyToAddress: 'hello@acme.example',
    footerPostalAddress: '1 Rue de Paris',
  },
};

describe(sendTestEmailAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1', name: 'Acme Co' },
      membership: { role: 'OWNER' },
    });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com' },
    });
    takeTestEmailSendMock.mockReset();
    takeTestEmailSendMock.mockReturnValue(true);
    vi.mocked(loadTenantEmailBrand).mockResolvedValue(TENANT_EMAIL_BRAND);
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({ logoAssetUrl: undefined });
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
    vi.mocked(logger.error).mockReset();
  });

  it('emails the draft to the signed-in admin, marked as a test', async () => {
    const result = await sendTestEmailAction('tenant-1', INPUT);

    expect(result).toEqual({ ok: true, to: 'admin@example.com' });
    expect(requireTenantMembershipMock).toHaveBeenCalledWith('tenant-1');
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@example.com',
        subject: '[Test] Connexion',
        replyTo: 'hello@acme.example',
        from: expect.stringMatching(/^Acme Co </),
        html: expect.stringContaining('Bonjour'),
      }),
    );
  });

  it('refuses without sending once the admin hits the limit', async () => {
    takeTestEmailSendMock.mockReturnValue(false);

    const result = await sendTestEmailAction('tenant-1', INPUT);

    expect(takeTestEmailSendMock).toHaveBeenCalledWith('admin-1');
    expect(result).toEqual({ ok: false, reason: 'rate-limited' });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('rejects a blank subject without reaching the tenant gate', async () => {
    const result = await sendTestEmailAction('tenant-1', {
      ...INPUT,
      copy: { ...INPUT.copy, subject: null },
    });

    expect(result).toEqual({ ok: false, reason: 'invalid' });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('rejects a body carrying an unsafe link', async () => {
    const result = await sendTestEmailAction('tenant-1', {
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

    expect(result).toEqual({ ok: false, reason: 'invalid' });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('reports and logs a failed send without throwing', async () => {
    sendEmailMock.mockRejectedValue(new Error('resend down'));

    const result = await sendTestEmailAction('tenant-1', INPUT);

    expect(result).toEqual({ ok: false, reason: 'failed' });
    expect(logger.error).toHaveBeenCalledWith(
      'email_test.send_failed',
      expect.objectContaining({ tenantId: 'tenant-1' }),
    );
  });

  it('propagates the tenant gate when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(sendTestEmailAction('tenant-1', INPUT)).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
