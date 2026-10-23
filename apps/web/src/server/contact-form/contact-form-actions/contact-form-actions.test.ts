import { ACTION_OUTCOME, CAPABILITY } from '@blog/config';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
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

const MOCK_NAME = faker.person.fullName();
const MOCK_EMAIL = faker.internet.email();
const MOCK_MESSAGE = faker.lorem.sentences(2);
const MOCK_SOURCE_PATH = `/${faker.lorem.slug()}`;
const MOCK_LEAD_ID = faker.string.uuid();
const BLOCKED = { outcome: ACTION_OUTCOME.BLOCKED };
const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR };
const MOCK_SUBMITTED = {
  tenantId: MOCK_TENANT_ID,
  name: MOCK_NAME,
  email: MOCK_EMAIL,
  message: MOCK_MESSAGE,
  sourcePath: MOCK_SOURCE_PATH,
};

const makeInput = (
  overrides: Partial<TContactMessageInput> = {},
): TContactMessageInput => ({
  name: MOCK_NAME,
  email: MOCK_EMAIL,
  message: MOCK_MESSAGE,
  website: '',
  sourcePath: MOCK_SOURCE_PATH,
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
    resolveRequestTenantMock.mockResolvedValue(mockTenant());
    createLeadMock.mockResolvedValue({ id: MOCK_LEAD_ID });
    sendContactNotificationMock.mockResolvedValue(undefined);
  });

  it('stores the lead, notifies the owner with what was sent and succeeds', async () => {
    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(createLeadMock).toHaveBeenCalledWith(MOCK_SUBMITTED);
    expect(sendContactNotificationMock).toHaveBeenCalledWith(MOCK_SUBMITTED);
  });

  it("gates on the resolved tenant's capability without a request context", async () => {
    await submitContactMessage(makeInput());

    expect(getTenantPlanMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getEffectiveSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it.each([
    ['a bot', () => isBotOrUnverifiedMock.mockResolvedValue(true)],
    ['a rate-limited sender', () => isRateLimitedMock.mockResolvedValue(true)],
    [
      'a suspended tenant',
      () =>
        resolveRequestTenantMock.mockResolvedValue(
          mockTenant({ status: TENANT_STATUS.SUSPENDED }),
        ),
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
      ...MOCK_SUBMITTED,
      sourcePath: '/',
    });
  });

  it('still succeeds and logs once when the notification email fails', async () => {
    sendContactNotificationMock.mockRejectedValue(MOCK_ERROR);

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(vi.mocked(logger.error)).toHaveBeenCalledOnce();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'contact_form.notification_send_failed',
      { leadId: MOCK_LEAD_ID, error: MOCK_ERROR },
    );
  });

  it('answers server-error without emailing when the lead cannot be stored', async () => {
    createLeadMock.mockRejectedValue(MOCK_ERROR);

    const result = await submitContactMessage(makeInput());

    expect(result).toEqual(SERVER_ERROR);
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });
});
