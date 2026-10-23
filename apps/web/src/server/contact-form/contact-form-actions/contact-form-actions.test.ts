import { ACTION_OUTCOME, CAPABILITY, LOCALE_ISO_CODES } from '@blog/config';
import type { queries } from '@blog/db';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import { MOCK_CONTACT_MESSAGE } from '@web/testing/modules/contact-form/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  submitContactMessage,
  type TContactMessageInput,
  type TContactMessageSource,
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

const MOCK_SOURCE_PATH = `/${faker.lorem.slug()}`;
const MOCK_LEAD_ID = faker.string.uuid();
const MOCK_CREATED_AT = faker.date.recent();
const MOCK_SOURCE: TContactMessageSource = {
  sourceDocumentId: faker.string.uuid(),
  sourceLocale: LOCALE_ISO_CODES.NL,
};

const mockInput = (
  overrides: Partial<TContactMessageInput> = {},
): TContactMessageInput => ({
  ...MOCK_CONTACT_MESSAGE,
  website: '',
  sourcePath: MOCK_SOURCE_PATH,
  ...overrides,
});

const MOCK_STORED_LEAD: queries.leads.TCreateLeadInput = {
  tenantId: MOCK_TENANT_ID,
  ...MOCK_CONTACT_MESSAGE,
  sourcePath: MOCK_SOURCE_PATH,
  ...MOCK_SOURCE,
};

const submit = (input: TContactMessageInput = mockInput()) =>
  submitContactMessage(input, MOCK_SOURCE);

describe(submitContactMessage, () => {
  beforeEach(() => {
    isBotOrUnverifiedMock.mockResolvedValue(false);
    isRateLimitedMock.mockResolvedValue(false);
    getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.GROWTH));
    getEffectiveSettingsFeaturesMock.mockResolvedValue(
      okResult({ [CAPABILITY.CONTACT_FORM]: true }),
    );
    resolveRequestTenantMock.mockResolvedValue(mockTenant());
    createLeadMock.mockImplementation(async (input) => ({
      id: MOCK_LEAD_ID,
      createdAt: MOCK_CREATED_AT,
      ...input,
    }));
    sendContactNotificationMock.mockResolvedValue(undefined);
  });

  it('stores the lead with the page it came from, notifies and answers success', async () => {
    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(createLeadMock).toHaveBeenCalledWith(MOCK_STORED_LEAD);
    expect(sendContactNotificationMock).toHaveBeenCalledWith({
      id: MOCK_LEAD_ID,
      createdAt: MOCK_CREATED_AT,
      ...MOCK_STORED_LEAD,
    });
  });

  it('checks the rate limit and capability against the resolved tenant', async () => {
    await submit();

    expect(isRateLimitedMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getTenantPlanMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getEffectiveSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it.each([
    ['a bot', () => isBotOrUnverifiedMock.mockResolvedValue(true)],
    ['a rate-limited address', () => isRateLimitedMock.mockResolvedValue(true)],
    [
      'a suspended tenant',
      () =>
        resolveRequestTenantMock.mockResolvedValue(
          mockTenant({ status: TENANT_STATUS.SUSPENDED }),
        ),
    ],
    [
      'a plan that does not entitle the contact form',
      () => getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.FREE)),
    ],
    [
      'the contact form capability switched off',
      () =>
        getEffectiveSettingsFeaturesMock.mockResolvedValue(
          okResult({ [CAPABILITY.CONTACT_FORM]: false }),
        ),
    ],
  ])('blocks %s without storing or sending', async (_, arrange) => {
    arrange();

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.BLOCKED });
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });

  it('blocks a filled honeypot before the rate limit, without storing or sending', async () => {
    const result = await submit(mockInput({ website: faker.internet.url() }));

    expect(result).toEqual({ outcome: ACTION_OUTCOME.BLOCKED });
    expect(isRateLimitedMock).not.toHaveBeenCalled();
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });

  it('answers server-error when no tenant resolves', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('names every invalid field without storing or sending', async () => {
    const result = await submit(
      mockInput({
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
    const result = await submit(mockInput({ name: 42 as unknown as string }));

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { name: { reason: FIELD_ERROR.INVALID } },
    });
  });

  it('strips line breaks from the name before storing it', async () => {
    const firstName = faker.person.firstName();
    const injected = `Bcc: ${faker.internet.email()}`;

    await submit(mockInput({ name: `${firstName}\r\n${injected}` }));

    expect(createLeadMock).toHaveBeenCalledWith({
      ...MOCK_STORED_LEAD,
      name: `${firstName} ${injected}`,
    });
  });

  it('stores the site root when the source path is not a local path', async () => {
    await submit(
      mockInput({
        sourcePath: `//${faker.internet.domainName()}/${faker.lorem.slug()}`,
      }),
    );

    expect(createLeadMock).toHaveBeenCalledWith({
      ...MOCK_STORED_LEAD,
      sourcePath: '/',
    });
  });

  it('still answers sent and logs once when the notification email fails', async () => {
    sendContactNotificationMock.mockRejectedValue(MOCK_ERROR);

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(vi.mocked(logger.error)).toHaveBeenCalledOnce();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'contact_form.notification_send_failed',
      { leadId: MOCK_LEAD_ID, error: MOCK_ERROR },
    );
  });

  it('answers server-error without emailing when the lead cannot be stored', async () => {
    createLeadMock.mockRejectedValue(MOCK_ERROR);

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });
});
