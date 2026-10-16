import { PRESET_ID, resolveTenantEmailBrand } from '@blog/config';
import type { schema } from '@blog/db';
import { logger } from '@web/utils/logger/logger';

import { sendContactNotification } from './contact-notification-send';

const { getContactRecipientMock, getEmailConfigMock, sendEmailMock, envMock } =
  vi.hoisted(() => ({
    getContactRecipientMock: vi.fn(),
    getEmailConfigMock: vi.fn(),
    sendEmailMock: vi.fn(),
    envMock: {} as Record<string, string | undefined>,
  }));

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: {
      getContactRecipient: getContactRecipientMock,
      getEmailConfig: getEmailConfigMock,
    },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/email')>()),
  sendEmail: sendEmailMock,
}));

vi.mock('@web/utils/resolve-tenant-email-identity', () => ({
  resolveTenantEmailIdentity: vi.fn().mockResolvedValue({
    brandName: 'Northwind Studio',
    brand: resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 40,
    }),
  }),
}));

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url', () => ({
  getTenantBaseUrl: vi.fn().mockResolvedValue('https://northwind.example'),
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));
vi.mock('@web/utils/logger/logger');

const lead: schema.TLead = {
  id: 'lead-1',
  tenantId: 'tenant-1',
  name: 'Priya Nair',
  email: 'priya@example.com',
  message: 'Could we talk about the relaunch next week?',
  sourcePath: '/en/contact',
  createdAt: new Date('2026-10-16T09:00:00Z'),
};

describe('sendContactNotification', () => {
  beforeEach(() => {
    envMock.PLATFORM_APP_URL = 'https://admin.example';
    envMock.NEWSLETTER_FROM_ADDRESS = 'Northwind <news@mail.example>';
    getContactRecipientMock.mockResolvedValue('owner@example.com');
    getEmailConfigMock.mockResolvedValue(undefined);
    sendEmailMock.mockResolvedValue(undefined);
  });

  it('emails the recipient with Reply-To set to the visitor', async () => {
    await sendContactNotification(lead);

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@example.com',
        from: 'Northwind <news@mail.example>',
        replyTo: 'priya@example.com',
        subject: 'New message from Priya Nair',
      }),
    );
  });

  it('links the page the message came from and the leads list', async () => {
    await sendContactNotification(lead);

    const [{ html }] = sendEmailMock.mock.calls[0] as [{ html: string }];
    expect(html).toContain('href="https://northwind.example/en/contact"');
    expect(html).toContain('href="https://admin.example/dashboard/leads"');
  });

  it('sends with an inert leads link and warns when the admin URL is unset', async () => {
    envMock.PLATFORM_APP_URL = undefined;

    await sendContactNotification(lead);

    const [{ html }] = sendEmailMock.mock.calls[0] as [{ html: string }];
    expect(sendEmailMock).toHaveBeenCalledOnce();
    expect(html).not.toContain('admin.example');
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'contact_form.platform_url_missing',
    );
  });

  it('throws without sending when the tenant has no recipient', async () => {
    getContactRecipientMock.mockResolvedValue(undefined);

    await expect(sendContactNotification(lead)).rejects.toThrow();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
