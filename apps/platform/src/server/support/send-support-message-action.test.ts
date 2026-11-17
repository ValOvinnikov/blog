import { faker } from '@faker-js/faker';
import {
  SUPPORT_FIELD_ERROR,
  SUPPORT_LIMIT,
  SUPPORT_LOG,
} from '@platform/constants/support';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_OPERATOR_SESSION } from '@platform/testing/admins/operator';
import { mockedAuth } from '@platform/testing/auth/mocked-auth';
import { mockedSupportEnv } from '@platform/testing/env/mocked-support-env';
import {
  mockMembershipContext,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { sendEmail } from '@shinefold/email';

import { sendSupportMessageAction } from './send-support-message-action';
import type { TSendSupportMessageInput } from './support-message-input';

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { admins: { getAdminByUserId: vi.fn() } },
}));
vi.mock('@shinefold/email');
vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@platform/server/auth/auth');
vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/support-env/support-env');

faker.seed(7184);

const MOCK_SUPPORT_ADDRESS = faker.internet.email();
const MOCK_SEND_ERROR = new Error(faker.lorem.sentence());
const MOCK_ORIGIN_PATH = `/dashboard/${faker.lorem.word()}`;

const INPUT: TSendSupportMessageInput = {
  subject: faker.lorem.words(3),
  message: faker.lorem.paragraph(),
  originPath: MOCK_ORIGIN_PATH,
};

const signInNewMember = () => {
  const user = { id: faker.string.uuid(), email: faker.internet.email() };
  mockedAuth.mockResolvedValue({ ...MOCK_OPERATOR_SESSION, user });

  return user;
};

const sentEmails = () =>
  vi.mocked(sendEmail).mock.calls.map(([email]) => email);

describe(sendSupportMessageAction, () => {
  let member: ReturnType<typeof signInNewMember>;

  beforeEach(() => {
    member = signInNewMember();
    mockedSupportEnv.SUPPORT_EMAIL_ADDRESS = MOCK_SUPPORT_ADDRESS;
    vi.mocked(sendEmail).mockReset();
    vi.mocked(sendEmail).mockResolvedValue(undefined);
  });

  it('emails support with the sender as reply-to, then sends the sender a copy', async () => {
    const result = await sendSupportMessageAction(MOCK_TENANT_ID, INPUT);

    const [toSupport, toSender] = sentEmails();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(toSupport).toMatchObject({
      to: MOCK_SUPPORT_ADDRESS,
      replyTo: member.email,
    });
    expect(toSender).toMatchObject({
      to: member.email,
      replyTo: MOCK_SUPPORT_ADDRESS,
      html: toSupport?.html,
    });
    expect(toSupport?.html).toContain(INPUT.message);
  });

  it('attaches the site, plan, status, account, role and originating page', async () => {
    const tenant = mockReadyTenant({ id: MOCK_TENANT_ID });
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockMembershipContext(tenant),
    );

    await sendSupportMessageAction(MOCK_TENANT_ID, INPUT);

    const [toSupport] = sentEmails();
    [
      tenant.name,
      tenant.siteUrl,
      tenant.plan,
      tenant.status,
      member.email,
      MEMBERSHIP_ROLE.OWNER,
      MOCK_ORIGIN_PATH,
    ].forEach((detail) => {
      expect(toSupport?.text).toContain(detail);
    });
  });

  it("names an operator's admin role, not their virtual membership", async () => {
    const membership = buildVirtualAdminMembership(member.id, MOCK_TENANT_ID);
    vi.mocked(requireTenantMembership).mockResolvedValueOnce({
      ...mockMembershipContext(
        mockReadyTenant({ id: MOCK_TENANT_ID }),
        membership,
      ),
      viewer: mockViewer({ membership }),
    });
    vi.mocked(queries.admins.getAdminByUserId).mockResolvedValueOnce(
      mockAdmin({ userId: member.id, role: ADMIN_ROLE.MODERATOR }),
    );

    await sendSupportMessageAction(MOCK_TENANT_ID, INPUT);

    const [toSupport] = sentEmails();
    expect(toSupport?.text).toContain(ADMIN_ROLE.MODERATOR);
    expect(toSupport?.text).not.toContain(MEMBERSHIP_ROLE.OWNER);
  });

  it('sends without an originating page when the one given is not a path', async () => {
    const foreignUrl = faker.internet.url();

    const result = await sendSupportMessageAction(MOCK_TENANT_ID, {
      ...INPUT,
      originPath: foreignUrl,
    });

    const [toSupport] = sentEmails();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(toSupport?.text).not.toContain(foreignUrl);
  });

  it.each([
    [
      'an empty message',
      { message: ' ' },
      'message',
      { reason: SUPPORT_FIELD_ERROR.REQUIRED },
    ],
    [
      'an empty subject',
      { subject: '' },
      'subject',
      { reason: SUPPORT_FIELD_ERROR.REQUIRED },
    ],
    [
      'an oversized message',
      { message: 'x'.repeat(SUPPORT_LIMIT.MESSAGE_MAX_LENGTH + 1) },
      'message',
      {
        reason: SUPPORT_FIELD_ERROR.TOO_LONG,
        values: { limit: SUPPORT_LIMIT.MESSAGE_MAX_LENGTH },
      },
    ],
  ])(
    'refuses %s before anything is sent',
    async (_name, override, field, error) => {
      const result = await sendSupportMessageAction(MOCK_TENANT_ID, {
        ...INPUT,
        ...override,
      });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: { [field]: error },
      });
      expect(requireTenantMembership).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    },
  );

  it('refuses without sending once the member hits the limit', async () => {
    const results = [];
    for (let send = 0; send <= SUPPORT_LIMIT.MESSAGES_PER_WINDOW; send += 1) {
      results.push(await sendSupportMessageAction(MOCK_TENANT_ID, INPUT));
    }

    expect(results.at(-1)).toEqual({ outcome: ACTION_OUTCOME.RATE_LIMITED });
    expect(
      sentEmails().filter(({ to }) => to === MOCK_SUPPORT_ADDRESS),
    ).toHaveLength(SUPPORT_LIMIT.MESSAGES_PER_WINDOW);
  });

  it('reports the form unavailable when no support address is configured', async () => {
    mockedSupportEnv.SUPPORT_EMAIL_ADDRESS = undefined;

    const result = await sendSupportMessageAction(MOCK_TENANT_ID, INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('reports and logs a failed send to support, and sends no copy', async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(MOCK_SEND_ERROR);

    const result = await sendSupportMessageAction(MOCK_TENANT_ID, INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(SUPPORT_LOG.SEND_FAILED, {
      tenantId: MOCK_TENANT_ID,
      errorName: MOCK_SEND_ERROR.name,
    });
  });

  it('still succeeds, and logs, when only the copy fails', async () => {
    vi.mocked(sendEmail)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(MOCK_SEND_ERROR);

    const result = await sendSupportMessageAction(MOCK_TENANT_ID, INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(logger.warn).toHaveBeenCalledWith(SUPPORT_LOG.COPY_FAILED, {
      tenantId: MOCK_TENANT_ID,
      errorName: MOCK_SEND_ERROR.name,
    });
  });

  it('propagates the tenant gate when the session has no membership', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(
      sendSupportMessageAction(MOCK_TENANT_ID, INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
