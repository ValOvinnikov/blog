import { ACTION_OUTCOME, CAPABILITY } from '@blog/config';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { okResult } from '@blog/utils';
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
const LEAD_ID = faker.string.uuid();
const BLOCKED = { outcome: ACTION_OUTCOME.BLOCKED };
const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR };
const SUBMITTED = {
  tenantId: TENANT_ID,
  name: NAME,
  email: EMAIL,
  message: MESSAGE,
  sourcePath: SOURCE_PATH,
};

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

describe(submitContactMessage, () => {
  beforeEach(() => {
    isBotOrUnverifiedMock.mockResolvedValue(false);
    isRateLimitedMock.mockResolvedValue(false);
    getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.GROWTH));
    getEffectiveSettingsFeaturesMock.mockResolvedValue(
      okResult({ [CAPABILITY.CONTACT_FORM]: true }),
    );
    resolveRequestTenantMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
    });
    createLeadMock.mockResolvedValue({ id: LEAD_ID });
    sendContactNotificationMock.mockResolvedValue(undefined);
  });

  it('stores the lead, notifies the owner with what was sent and succeeds', async () => {
    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(createLeadMock).toHaveBeenCalledWith(SUBMITTED);
    expect(sendContactNotificationMock).toHaveBeenCalledWith(SUBMITTED);
  });

  it("gates on the resolved tenant's capability without a request context", async () => {
    await submitContactMessage(makeInput());

    expect(getTenantPlanMock).toHaveBeenCalledWith(TENANT_ID);
    expect(getEffectiveSettingsFeaturesMock).toHaveBeenCalledWith(TENANT_ID);
  });

  it.each([
    ['a bot', () => isBotOrUnverifiedMock.mockResolvedValue(true)],
    ['a rate-limited sender', () => isRateLimitedMock.mockResolvedValue(true)],
    [
      'a suspended tenant',
      () =>
        resolveRequestTenantMock.mockResolvedValue({
          id: TENANT_ID,
          status: TENANT_STATUS.SUSPENDED,
          deprovisionedAt: null,
        }),
    ],
    [
      'a plan without the contact form',
      () => getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.FREE)),
    ],
    [
      'the contact form switched off',
      () =>
        getEffectiveSettingsFeaturesMock.mockResolvedValue(
          okResult({ [CAPABILITY.CONTACT_FORM]: false }),
        ),
    ],
  ])('blocks %s without storing or sending', async (_case, arrange) => {
    arrange();

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual(BLOCKED);
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });

  it('blocks a filled honeypot before the rate limit is counted', async () => {
    const result = await submitContactMessage(
      makeInput({ website: faker.internet.url() }),
    );

    expect(result).toEqual(BLOCKED);
    expect(isRateLimitedMock).not.toHaveBeenCalled();
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it('answers server-error when no tenant resolves', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    expect(await submitContactMessage(makeInput())).toEqual(SERVER_ERROR);
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

  it('stores the site root when the source path is not a local path', async () => {
    await submitContactMessage(
      makeInput({
        sourcePath: `//${faker.internet.domainName()}/${faker.lorem.slug()}`,
      }),
    );

    expect(createLeadMock).toHaveBeenCalledWith({
      ...SUBMITTED,
      sourcePath: '/',
    });
  });

  it('still succeeds and logs once when the notification email fails', async () => {
    const error = new Error(faker.lorem.sentence());
    sendContactNotificationMock.mockRejectedValue(error);

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(vi.mocked(logger.error)).toHaveBeenCalledOnce();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'contact_form.notification_send_failed',
      { leadId: LEAD_ID, error },
    );
  });

  it('answers server-error without emailing when the lead cannot be stored', async () => {
    createLeadMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual(SERVER_ERROR);
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });
});
