import { ACTION_OUTCOME, CAPABILITY } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PLAN } from '@blog/db/constants';
import { sendEmail } from '@blog/email';
import type * as TEmail from '@blog/email';
import { FORWARDED_FOR_HEADER } from '@blog/utils/client-key';
import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { isTenantActive } from '@web/server/tenant/write-gate/write-gate';
import { MOCK_CONTACT_MESSAGE } from '@web/testing/modules/contact-form/fixtures';
import {
  MOCK_LEAD_SOURCE,
  MOCK_LEAD_SOURCE_PATH,
  mockLeadInput,
} from '@web/testing/server/contact-form/fixtures';
import { firstSentEmail } from '@web/testing/server/newsletter/fixtures';
import { mockSettingsFeaturesRowEnabling } from '@web/testing/server/settings-features/fixtures';
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

const { checkBotId, headersMock } = vi.hoisted(() => ({
  checkBotId: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/server/tenant/write-gate/write-gate');

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

vi.mock('@web/utils/env/env');

vi.mock('botid/server', () => ({ checkBotId }));

vi.mock('next/headers', () => ({ headers: headersMock }));

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    leads: { createLead: vi.fn() },
    tenants: { getTenantById: vi.fn() },
    settingsFeatures: { getSettingsFeatures: vi.fn() },
    siteConfig: { getSiteConfig: vi.fn() },
    emailConfig: { getContactRecipient: vi.fn(), getEmailConfig: vi.fn() },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof TEmail>()),
  sendEmail: vi.fn(),
}));

faker.seed(6010);

const MOCK_LEAD_ID = faker.string.uuid();
const MOCK_RECIPIENT = faker.internet.email();
const NOTIFICATION_SEND_FAILED_EVENT = 'contact_form.notification_send_failed';
const ATTEMPTS_BEFORE_REFUSAL = 5;

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
    checkBotId.mockResolvedValue({ isBot: false });
    headersMock.mockResolvedValue(
      new Headers({ [FORWARDED_FOR_HEADER]: faker.internet.ipv4() }),
    );
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
    );
    vi.mocked(queries.settingsFeatures.getSettingsFeatures).mockResolvedValue(
      mockSettingsFeaturesRowEnabling([CAPABILITY.CONTACT_FORM]),
    );
    vi.mocked(queries.siteConfig.getSiteConfig).mockResolvedValue(undefined);
    vi.mocked(queries.leads.createLead).mockResolvedValue({ id: MOCK_LEAD_ID });
    vi.mocked(queries.emailConfig.getContactRecipient).mockResolvedValue(
      MOCK_RECIPIENT,
    );
    vi.mocked(queries.emailConfig.getEmailConfig).mockResolvedValue(undefined);
  });

  it('stores the lead with its source and succeeds', async () => {
    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(queries.leads.createLead).toHaveBeenCalledWith(mockLeadInput());
  });

  it('emails the tenant recipient with Reply-To set to the visitor', async () => {
    await submit();

    const { to, replyTo } = firstSentEmail(vi.mocked(sendEmail));
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(to).toBe(MOCK_RECIPIENT);
    expect(replyTo).toBe(MOCK_CONTACT_MESSAGE.email);
  });

  it('reads the capability toggles of the resolved tenant', async () => {
    await submit();

    expect(queries.settingsFeatures.getSettingsFeatures).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it.each([
    ['a bot', () => checkBotId.mockResolvedValueOnce({ isBot: true })],
    [
      'an inactive tenant',
      () => vi.mocked(isTenantActive).mockReturnValueOnce(false),
    ],
    [
      'a plan that does not entitle the contact form',
      () =>
        vi
          .mocked(queries.tenants.getTenantById)
          .mockResolvedValueOnce(mockTenant({ plan: TENANT_PLAN.FREE })),
    ],
    [
      'the contact form capability switched off',
      () =>
        vi
          .mocked(queries.settingsFeatures.getSettingsFeatures)
          .mockResolvedValueOnce(mockSettingsFeaturesRowEnabling([])),
    ],
  ])('blocks %s without storing or sending', async (_, arrange) => {
    arrange();

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.BLOCKED });
    expect(queries.leads.createLead).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('refuses the sixth submission from one address', async () => {
    const outcomes = [];
    for (let i = 0; i <= ATTEMPTS_BEFORE_REFUSAL; i += 1) {
      outcomes.push((await submit()).outcome);
    }

    expect(outcomes).toEqual([
      ACTION_OUTCOME.SUCCESS,
      ACTION_OUTCOME.SUCCESS,
      ACTION_OUTCOME.SUCCESS,
      ACTION_OUTCOME.SUCCESS,
      ACTION_OUTCOME.SUCCESS,
      ACTION_OUTCOME.BLOCKED,
    ]);
    expect(queries.leads.createLead).toHaveBeenCalledTimes(
      ATTEMPTS_BEFORE_REFUSAL,
    );
  });

  it('blocks a filled honeypot without storing or sending', async () => {
    const result = await submit(mockInput({ website: faker.internet.url() }));

    expect(result).toEqual({ outcome: ACTION_OUTCOME.BLOCKED });
    expect(queries.leads.createLead).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does not count honeypot submissions against the rate limit', async () => {
    for (let i = 0; i <= ATTEMPTS_BEFORE_REFUSAL; i += 1) {
      await submit(mockInput({ website: faker.internet.url() }));
    }

    const result = await submit();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
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
    expect(sendEmail).not.toHaveBeenCalled();
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
    vi.mocked(sendEmail).mockRejectedValueOnce(MOCK_ERROR);

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
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
