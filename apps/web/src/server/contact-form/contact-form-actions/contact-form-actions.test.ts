import { ACTION_OUTCOME, CAPABILITY, LOCALE_ISO_CODES } from '@blog/config';
import type { queries } from '@blog/db';
import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantStatus,
} from '@blog/db/constants';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
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

const NAME = faker.person.fullName();
const EMAIL = faker.internet.email();
const MESSAGE = faker.lorem.sentences(2);
const SOURCE_PATH = `/${faker.lorem.slug()}`;
const LEAD_ID = faker.string.uuid();
const CREATED_AT = faker.date.recent();
const SOURCE: TContactMessageSource = {
  sourceDocumentId: faker.string.uuid(),
  sourceLocale: LOCALE_ISO_CODES.NL,
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

const STORED_LEAD: queries.leads.TCreateLeadInput = {
  tenantId: MOCK_TENANT_ID,
  name: NAME,
  email: EMAIL,
  message: MESSAGE,
  sourcePath: SOURCE_PATH,
  ...SOURCE,
};

const submit = (input: TContactMessageInput = makeInput()) =>
  submitContactMessage(input, SOURCE);

const tenantWithStatus = (status: TTenantStatus) => ({
  id: MOCK_TENANT_ID,
  status,
  deprovisionedAt: null,
});

describe(submitContactMessage, () => {
  beforeEach(() => {
    isBotOrUnverifiedMock.mockResolvedValue(false);
    isRateLimitedMock.mockResolvedValue(false);
    getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.GROWTH));
    getEffectiveSettingsFeaturesMock.mockResolvedValue(
      okResult({ [CAPABILITY.CONTACT_FORM]: true }),
    );
    resolveRequestTenantMock.mockResolvedValue(
      tenantWithStatus(TENANT_STATUS.ACTIVE),
    );
    createLeadMock.mockImplementation(async (input) => ({
      id: LEAD_ID,
      createdAt: CREATED_AT,
      ...input,
    }));
    sendContactNotificationMock.mockResolvedValue(undefined);
  });

  it('stores the lead with the page it came from, notifies and answers success', async () => {
    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(createLeadMock).toHaveBeenCalledWith(STORED_LEAD);
    expect(sendContactNotificationMock).toHaveBeenCalledWith({
      id: LEAD_ID,
      createdAt: CREATED_AT,
      ...STORED_LEAD,
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
          tenantWithStatus(TENANT_STATUS.SUSPENDED),
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
    const result = await submit(makeInput({ website: faker.internet.url() }));

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
    const result = await submit(makeInput({ name: 42 as unknown as string }));

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { name: { reason: FIELD_ERROR.INVALID } },
    });
  });

  it('strips line breaks from the name before storing it', async () => {
    const firstName = faker.person.firstName();
    const injected = `Bcc: ${faker.internet.email()}`;

    await submit(makeInput({ name: `${firstName}\r\n${injected}` }));

    expect(createLeadMock).toHaveBeenCalledWith({
      ...STORED_LEAD,
      name: `${firstName} ${injected}`,
    });
  });

  it('stores the site root when the source path is not a local path', async () => {
    await submit(
      makeInput({
        sourcePath: `//${faker.internet.domainName()}/${faker.lorem.slug()}`,
      }),
    );

    expect(createLeadMock).toHaveBeenCalledWith({
      ...STORED_LEAD,
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
      { leadId: LEAD_ID, error: MOCK_ERROR },
    );
  });

  it('answers server-error without emailing when the lead cannot be stored', async () => {
    createLeadMock.mockRejectedValue(MOCK_ERROR);

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(sendContactNotificationMock).not.toHaveBeenCalled();
  });
});
