import { ACTION_OUTCOME, CAPABILITY } from '@blog/config';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
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
  getTenantPlanMock,
  getEffectiveSettingsFeaturesMock,
} = vi.hoisted(() => ({
  isBotOrUnverifiedMock: vi.fn(),
  isRateLimitedMock: vi.fn(),
  createLeadMock: vi.fn(),
  sendContactNotificationMock: vi.fn(),
  resolveRequestTenantMock: vi.fn(),
  getTenantPlanMock: vi.fn(),
  getEffectiveSettingsFeaturesMock: vi.fn(),
}));

vi.mock('@web/server/rate-limit/public-write-guard/public-write-guard', () => ({
  createPublicWriteGuard: () => ({
    isBotOrUnverified: isBotOrUnverifiedMock,
    isRateLimited: isRateLimitedMock,
  }),
}));

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
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
  '@web/server/settings-features/get-tenant-plan/get-tenant-plan',
  () => ({ getTenantPlan: getTenantPlanMock }),
);

vi.mock(
  '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features',
  () => ({ getEffectiveSettingsFeatures: getEffectiveSettingsFeaturesMock }),
);

const TENANT_ID = faker.string.uuid();
const NAME = faker.person.fullName();
const EMAIL = faker.internet.email();
const MESSAGE = faker.lorem.sentences(2);
const SOURCE_PATH = `/${faker.lorem.slug()}`;

const makeInput = (
  overrides: Partial<TContactMessageInput> = {},
): TContactMessageInput => ({
  name: NAME,
  email: EMAIL,
  message: MESSAGE,
  website: '',
  sourcePath: SOURCE_PATH,
  ...overrides,
});

describe('submitContactMessage', () => {
  beforeEach(() => {
    isBotOrUnverifiedMock.mockResolvedValue(false);
    isRateLimitedMock.mockResolvedValue(false);
    getTenantPlanMock.mockResolvedValue({ ok: true, data: TENANT_PLAN.GROWTH });
    getEffectiveSettingsFeaturesMock.mockResolvedValue({
      ok: true,
      data: { [CAPABILITY.CONTACT_FORM]: true },
    });
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
    });
    createLeadMock.mockImplementation(async (input) => ({
      id: faker.string.uuid(),
      createdAt: new Date(),
      ...input,
    }));
    sendContactNotificationMock.mockResolvedValue(undefined);
  });

  it('stores the lead, notifies the owner and answers success', async () => {
    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });

    expect(createLeadMock).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      name: NAME,
      email: EMAIL,
      message: MESSAGE,
      sourcePath: SOURCE_PATH,
    });
    expect(sendContactNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, name: NAME }),
    );
  });

  it("gates on the resolved tenant's capability without a request context", async () => {
    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(getTenantPlanMock).toHaveBeenCalledWith(TENANT_ID);
    expect(getEffectiveSettingsFeaturesMock).toHaveBeenCalledWith(TENANT_ID);
  });

  it('blocks a bot without storing or sending', async () => {
    isBotOrUnverifiedMock.mockResolvedValue(true);

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.BLOCKED,
    });
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });

  it('blocks a filled honeypot without storing or sending', async () => {
    const result = await submitContactMessage(
      makeInput({ website: faker.internet.url() }),
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.BLOCKED });
    expect(isRateLimitedMock).not.toHaveBeenCalled();
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });

  it('blocks a rate-limited address without storing or sending', async () => {
    isRateLimitedMock.mockResolvedValue(true);

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.BLOCKED,
    });
    expect(isRateLimitedMock).toHaveBeenCalledWith(TENANT_ID);
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });

  it('blocks a suspended tenant without storing or sending', async () => {
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.SUSPENDED,
      deprovisionedAt: null,
    });

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.BLOCKED,
    });
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it('blocks when the plan does not entitle the contact form', async () => {
    getTenantPlanMock.mockResolvedValue({ ok: true, data: TENANT_PLAN.FREE });

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.BLOCKED,
    });
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it('blocks when the contact form capability is off', async () => {
    getEffectiveSettingsFeaturesMock.mockResolvedValue({
      ok: true,
      data: { [CAPABILITY.CONTACT_FORM]: false },
    });

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.BLOCKED,
    });
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it('answers server-error when no tenant resolves', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
  });

  it('names every invalid field without storing or sending', async () => {
    const result = await submitContactMessage(
      makeInput({
        name: ' ',
        email: faker.lorem.word(),
        message: faker.string.alpha(9),
      }),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        name: { reason: FIELD_ERROR.INVALID },
        email: { reason: FIELD_ERROR.INVALID },
        message: { reason: FIELD_ERROR.INVALID },
      },
    });
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it('treats a field that is not text as empty', async () => {
    const result = await submitContactMessage(
      makeInput({ name: 42 as unknown as string }),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { name: { reason: FIELD_ERROR.INVALID } },
    });
  });

  it('strips line breaks from the name before storing it', async () => {
    const firstName = faker.person.firstName();
    const injected = `Bcc: ${faker.internet.email()}`;

    await submitContactMessage(
      makeInput({ name: `${firstName}\r\n${injected}` }),
    );

    expect(createLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: `${firstName} ${injected}` }),
    );
  });

  it('stores the site root when the source path is not a local path', async () => {
    await submitContactMessage(
      makeInput({
        sourcePath: `//${faker.internet.domainName()}/${faker.lorem.slug()}`,
      }),
    );

    expect(createLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePath: '/' }),
    );
  });

  it('still answers sent and logs once when the notification email fails', async () => {
    sendContactNotificationMock.mockRejectedValue(
      new Error(faker.lorem.sentence()),
    );

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(vi.mocked(logger.error)).toHaveBeenCalledOnce();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'contact_form.notification_send_failed',
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });

  it('answers server-error without emailing when the lead cannot be stored', async () => {
    createLeadMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });
});
