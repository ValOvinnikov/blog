import { ACTION_OUTCOME, CAPABILITY } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PLAN } from '@blog/db/constants';
import { okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import { sendContactNotification } from '@web/server/contact-form/contact-notification-send/contact-notification-send';
import { getEffectiveSettingsFeatures } from '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { isTenantActive } from '@web/server/tenant/write-gate/write-gate';
import { MOCK_CONTACT_MESSAGE } from '@web/testing/modules/contact-form/fixtures';
import {
  MOCK_LEAD_SOURCE,
  MOCK_LEAD_SOURCE_PATH,
  mockEffectiveFeatures,
  mockLeadInput,
} from '@web/testing/server/contact-form/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  submitContactMessage,
  type TContactMessageInput,
} from './contact-form-actions';

const { isLimited, checkBotId } = vi.hoisted(() => ({
  isLimited: vi.fn<(input: { tenantKey: string }) => Promise<boolean>>(
    async () => false,
  ),
  checkBotId: vi.fn(async () => ({ isBot: false })),
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/server/tenant/write-gate/write-gate');

vi.mock('botid/server', () => ({ checkBotId }));

vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));

vi.mock('@web/server/rate-limit/rate-limiter/rate-limiter', () => ({
  createRateLimiter: () => ({ isLimited }),
}));

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: { leads: { createLead: vi.fn() } },
}));

vi.mock(
  '@web/server/contact-form/contact-notification-send/contact-notification-send',
  () => ({ sendContactNotification: vi.fn() }),
);

vi.mock(
  '@web/server/settings-features/get-tenant-plan/get-tenant-plan',
  () => ({ getTenantPlan: vi.fn() }),
);

vi.mock(
  '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features',
  () => ({ getEffectiveSettingsFeatures: vi.fn() }),
);

faker.seed(6010);

const MOCK_LEAD_ID = faker.string.uuid();
const NOTIFICATION_SEND_FAILED_EVENT = 'contact_form.notification_send_failed';

const mockInput = (
  overrides: Partial<TContactMessageInput> = {},
): TContactMessageInput => ({
  ...MOCK_CONTACT_MESSAGE,
  website: '',
  sourcePath: MOCK_LEAD_SOURCE_PATH,
  ...overrides,
});

const submit = (input: TContactMessageInput = mockInput()) =>
  submitContactMessage(input, MOCK_LEAD_SOURCE);

describe(submitContactMessage, () => {
  beforeEach(() => {
    vi.mocked(getTenantPlan).mockResolvedValue(okResult(TENANT_PLAN.GROWTH));
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(
      okResult(mockEffectiveFeatures({ [CAPABILITY.CONTACT_FORM]: true })),
    );
    vi.mocked(queries.leads.createLead).mockResolvedValue({ id: MOCK_LEAD_ID });
  });

  it('stores the lead with its source, notifies the owner and succeeds', async () => {
    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(queries.leads.createLead).toHaveBeenCalledWith(mockLeadInput());
    expect(sendContactNotification).toHaveBeenCalledWith(mockLeadInput());
  });

  it('checks the rate limit and capability against the resolved tenant', async () => {
    await submit();

    const tenantKeys = isLimited.mock.calls.map(([{ tenantKey }]) => tenantKey);
    expect(tenantKeys).toEqual([MOCK_TENANT_ID]);
    expect(getTenantPlan).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it.each([
    ['a bot', () => checkBotId.mockResolvedValueOnce({ isBot: true })],
    ['a rate-limited address', () => isLimited.mockResolvedValueOnce(true)],
    [
      'an inactive tenant',
      () => vi.mocked(isTenantActive).mockReturnValueOnce(false),
    ],
    [
      'a plan that does not entitle the contact form',
      () =>
        vi
          .mocked(getTenantPlan)
          .mockResolvedValueOnce(okResult(TENANT_PLAN.FREE)),
    ],
    [
      'the contact form capability switched off',
      () =>
        vi
          .mocked(getEffectiveSettingsFeatures)
          .mockResolvedValueOnce(okResult(mockEffectiveFeatures())),
    ],
  ])('blocks %s without storing or sending', async (_, arrange) => {
    arrange();

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.BLOCKED });
    expect(queries.leads.createLead).not.toHaveBeenCalled();
    expect(sendContactNotification).not.toHaveBeenCalled();
  });

  it('blocks a filled honeypot before the rate limit, without storing or sending', async () => {
    const result = await submit(mockInput({ website: faker.internet.url() }));

    expect(result).toEqual({ outcome: ACTION_OUTCOME.BLOCKED });
    expect(isLimited).not.toHaveBeenCalled();
    expect(queries.leads.createLead).not.toHaveBeenCalled();
    expect(sendContactNotification).not.toHaveBeenCalled();
  });

  it('answers server-error when no tenant resolves', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

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
    expect(queries.leads.createLead).not.toHaveBeenCalled();
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

    expect(queries.leads.createLead).toHaveBeenCalledWith(
      mockLeadInput({ name: `${firstName} ${injected}` }),
    );
  });

  it('stores the site root when the source path is not a local path', async () => {
    await submit(
      mockInput({
        sourcePath: `//${faker.internet.domainName()}/${faker.lorem.slug()}`,
      }),
    );

    expect(queries.leads.createLead).toHaveBeenCalledWith(
      mockLeadInput({ sourcePath: '/' }),
    );
  });

  it('still succeeds and logs once when the notification email fails', async () => {
    vi.mocked(sendContactNotification).mockRejectedValueOnce(MOCK_ERROR);

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(NOTIFICATION_SEND_FAILED_EVENT, {
      leadId: MOCK_LEAD_ID,
      error: MOCK_ERROR,
    });
  });

  it('answers server-error without emailing when the lead cannot be stored', async () => {
    vi.mocked(queries.leads.createLead).mockRejectedValueOnce(MOCK_ERROR);

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(sendContactNotification).not.toHaveBeenCalled();
  });
});
