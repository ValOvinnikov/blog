import { faker } from '@faker-js/faker';
import {
  MOCK_DB_ERROR_MESSAGE,
  MOCK_FROM_ADDRESS,
  MOCK_INVITER_EMAIL,
  MOCK_INVITER_NAME,
  mockPendingAdminInvite,
} from '@shinefold/auth/testing/magic-link-fixtures';
import { sentEmailOf } from '@shinefold/auth/testing/sent-email';
import { MOCK_EMAIL } from '@shinefold/auth/testing/session-fixtures';
import { EMAIL_ACCOUNT, EMAIL_TYPE } from '@shinefold/config/constants';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import {
  PLATFORM_EMAIL_BRAND_NAME,
  type TSendEmailInput,
} from '@shinefold/email';

import { sendPendingAdminInviteEmail } from './send-pending-admin-invite-email';

const MOCK_URL = faker.internet.url();

const {
  findPendingAdminInviteMock,
  recordPlatformEmailSendMock,
  sendEmailMock,
  onSendCountFailedMock,
} = vi.hoisted(() => ({
  findPendingAdminInviteMock: vi.fn(),
  recordPlatformEmailSendMock: vi.fn(),
  sendEmailMock: vi.fn<(input: TSendEmailInput) => Promise<void>>(),
  onSendCountFailedMock: vi.fn(),
}));

vi.mock('@shinefold/db', () => ({
  queries: {
    adminInvites: { findPendingAdminInvite: findPendingAdminInviteMock },
    emailUsage: { recordPlatformEmailSend: recordPlatformEmailSendMock },
  },
}));

vi.mock(import('@shinefold/email'), async (importOriginal) => ({
  ...(await importOriginal()),
  sendEmail: sendEmailMock,
}));

const send = () =>
  sendPendingAdminInviteEmail({
    from: MOCK_FROM_ADDRESS,
    identifier: MOCK_EMAIL,
    url: MOCK_URL,
    onSendCountFailed: onSendCountFailedMock,
  });

describe(sendPendingAdminInviteEmail, () => {
  describe('with a pending admin invite', () => {
    let isSent: boolean;

    beforeEach(async () => {
      findPendingAdminInviteMock.mockResolvedValue(mockPendingAdminInvite());
      isSent = await send();
    });

    it('sends the admin-invite email from the platform account and reports it sent', () => {
      const { account, to, from, html } = sentEmailOf(sendEmailMock);
      expect(isSent).toBe(true);
      expect(findPendingAdminInviteMock).toHaveBeenCalledWith(MOCK_EMAIL);
      expect([account, to, from]).toEqual([
        EMAIL_ACCOUNT.PLATFORM,
        MOCK_EMAIL,
        MOCK_FROM_ADDRESS,
      ]);
      expect(html).toContain(MOCK_URL);
    });

    it('names the inviter and shows the role as a readable label', () => {
      const { subject, text } = sentEmailOf(sendEmailMock);
      expect(subject).toContain(MOCK_INVITER_NAME);
      expect(text).toContain('Super admin');
      expect(text).not.toContain(ADMIN_ROLE.SUPERADMIN);
    });

    it('counts one platform invite send', () => {
      expect(recordPlatformEmailSendMock).toHaveBeenCalledExactlyOnceWith(
        EMAIL_TYPE.INVITE,
      );
    });
  });

  it.each([
    ['has no name', null],
    ['has a blank name', ' '],
  ])(
    'names the inviter by email address when the inviter %s',
    async (_, inviterName) => {
      findPendingAdminInviteMock.mockResolvedValue(
        mockPendingAdminInvite({ inviterName }),
      );

      await send();

      expect(sentEmailOf(sendEmailMock).subject).toContain(MOCK_INVITER_EMAIL);
    },
  );

  it('names the platform when the inviter is gone', async () => {
    findPendingAdminInviteMock.mockResolvedValue(
      mockPendingAdminInvite({ inviterName: null, inviterEmail: null }),
    );

    await send();

    expect(sentEmailOf(sendEmailMock).subject).toMatch(
      new RegExp(`^${PLATFORM_EMAIL_BRAND_NAME} `),
    );
  });

  it.each([
    [
      'there is no pending admin invite',
      () => findPendingAdminInviteMock.mockResolvedValue(undefined),
    ],
    [
      'the lookup throws',
      () =>
        findPendingAdminInviteMock.mockRejectedValue(
          new Error(MOCK_DB_ERROR_MESSAGE),
        ),
    ],
  ])('sends nothing and reports no send when %s', async (_, arrange) => {
    arrange();

    await expect(send()).resolves.toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
