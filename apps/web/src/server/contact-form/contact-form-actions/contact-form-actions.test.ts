import { faker } from '@faker-js/faker';
import { logger } from '@web/utils/logger/logger';

import {
  submitContactMessage,
  type TContactMessageInput,
} from './contact-form-actions';

const {
  isBotOrUnverifiedMock,
  isRateLimitedMock,
  createLeadMock,
  sendContactNotificationMock,
  resolveRequestTenantMock,
  isCapabilityEnabledMock,
} = vi.hoisted(() => ({
  isBotOrUnverifiedMock: vi.fn(),
  isRateLimitedMock: vi.fn(),
  createLeadMock: vi.fn(),
  sendContactNotificationMock: vi.fn(),
  resolveRequestTenantMock: vi.fn(),
  isCapabilityEnabledMock: vi.fn(),
}));

vi.mock('@web/server/rate-limit/public-write-guard/public-write-guard', () => ({
  createPublicWriteGuard: () => ({
    isBotOrUnverified: isBotOrUnverifiedMock,
    isRateLimited: isRateLimitedMock,
  }),
}));

vi.mock('@blog/db', () => ({
  TENANT_STATUS: { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' },
  queries: { leads: { createLead: createLeadMock } },
}));

vi.mock(
  '@web/server/contact-form/contact-notification-send/contact-notification-send',
  () => ({ sendContactNotification: sendContactNotificationMock }),
);

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: resolveRequestTenantMock,
}));

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({ isCapabilityEnabled: isCapabilityEnabledMock }),
);

vi.mock('@web/utils/logger/logger');

const TENANT_ID = '11111111-1111-4111-8111-111111111111';

const makeInput = (
  overrides: Partial<TContactMessageInput> = {},
): TContactMessageInput => ({
  name: 'Priya Nair',
  email: 'priya@example.com',
  message: 'Could we talk about the relaunch next week?',
  website: '',
  sourcePath: '/en/contact',
  ...overrides,
});

describe('submitContactMessage', () => {
  beforeEach(() => {
    isBotOrUnverifiedMock.mockResolvedValue(false);
    isRateLimitedMock.mockResolvedValue(false);
    isCapabilityEnabledMock.mockResolvedValue(true);
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: 'ACTIVE',
      deprovisionedAt: null,
    });
    createLeadMock.mockImplementation(async (input) => ({
      id: faker.string.uuid(),
      createdAt: new Date(),
      ...input,
    }));
    sendContactNotificationMock.mockResolvedValue(undefined);
  });

  it('stores the lead, notifies the owner and answers sent', async () => {
    await expect(submitContactMessage(makeInput())).resolves.toEqual({
      outcome: 'sent',
    });

    expect(createLeadMock).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      name: 'Priya Nair',
      email: 'priya@example.com',
      message: 'Could we talk about the relaunch next week?',
      sourcePath: '/en/contact',
    });
    expect(sendContactNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, name: 'Priya Nair' }),
    );
  });

  it('blocks a bot without storing or sending', async () => {
    isBotOrUnverifiedMock.mockResolvedValue(true);

    await expect(submitContactMessage(makeInput())).resolves.toEqual({
      outcome: 'blocked',
    });
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });

  it('blocks a filled honeypot without storing or sending', async () => {
    await expect(
      submitContactMessage(makeInput({ website: 'https://spam.example' })),
    ).resolves.toEqual({ outcome: 'blocked' });
    expect(isRateLimitedMock).not.toHaveBeenCalled();
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });

  it('blocks a rate-limited address without storing or sending', async () => {
    isRateLimitedMock.mockResolvedValue(true);

    await expect(submitContactMessage(makeInput())).resolves.toEqual({
      outcome: 'blocked',
    });
    expect(isRateLimitedMock).toHaveBeenCalledWith(TENANT_ID);
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });

  it('blocks a suspended tenant without storing or sending', async () => {
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: 'SUSPENDED',
      deprovisionedAt: null,
    });

    await expect(submitContactMessage(makeInput())).resolves.toEqual({
      outcome: 'blocked',
    });
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it('blocks when the contact form capability is off', async () => {
    isCapabilityEnabledMock.mockResolvedValue(false);

    await expect(submitContactMessage(makeInput())).resolves.toEqual({
      outcome: 'blocked',
    });
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it('answers server-error when no tenant resolves', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    await expect(submitContactMessage(makeInput())).resolves.toEqual({
      outcome: 'server-error',
    });
  });

  it('names every invalid field without storing or sending', async () => {
    await expect(
      submitContactMessage(
        makeInput({ name: ' ', email: 'not-an-email', message: 'Too short' }),
      ),
    ).resolves.toEqual({
      outcome: 'invalid',
      invalidFields: ['name', 'email', 'message'],
    });
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it('treats a field that is not text as empty', async () => {
    await expect(
      submitContactMessage(makeInput({ name: 42 as unknown as string })),
    ).resolves.toEqual({ outcome: 'invalid', invalidFields: ['name'] });
  });

  it('strips line breaks from the name before storing it', async () => {
    await submitContactMessage(makeInput({ name: 'Priya\r\nBcc: x@y.z' }));

    expect(createLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Priya Bcc: x@y.z' }),
    );
  });

  it('stores the site root when the source path is not a local path', async () => {
    await submitContactMessage(
      makeInput({ sourcePath: '//evil.example/phish' }),
    );

    expect(createLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePath: '/' }),
    );
  });

  it('still answers sent and logs once when the notification email fails', async () => {
    sendContactNotificationMock.mockRejectedValue(new Error('resend down'));

    await expect(submitContactMessage(makeInput())).resolves.toEqual({
      outcome: 'sent',
    });
    expect(vi.mocked(logger.error)).toHaveBeenCalledOnce();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'contact_form.notification_send_failed',
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });

  it('answers server-error without emailing when the lead cannot be stored', async () => {
    createLeadMock.mockRejectedValue(new Error('db down'));

    await expect(submitContactMessage(makeInput())).resolves.toEqual({
      outcome: 'server-error',
    });
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });
});
