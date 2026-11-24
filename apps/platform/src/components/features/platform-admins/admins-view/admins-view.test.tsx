import messages from '@platform/i18n/messages/en.json';
import { MOCK_ADMIN_EMAIL } from '@platform/testing/admins/fixtures';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_ADMIN_INVITE_ID,
  MOCK_INVITED_ADMIN_EMAIL,
  MOCK_LISTED_ADMIN_EMAIL,
  MOCK_LISTED_ADMIN_ID,
  MOCK_LISTED_ADMIN_NAME,
  MOCK_ADMIN_GRANTED_AT,
  MOCK_ADMIN_INVITED_AT,
} from '@platform/testing/platform-admins/fixtures';
import { ADMIN_ROLE } from '@shinefold/db/constants';

import { AdminsView } from './admins-view';

vi.mock('@platform/server/platform-admins/invite-admin-action');

vi.mock('@platform/server/platform-admins/resend-admin-invite-action');

vi.mock('@platform/server/platform-admins/cancel-admin-invite-action');

vi.mock('@platform/server/platform-admins/remove-admin-action');

const { adminInvitesTable, inviteAdminCard, roleLabel } = messages;
const tRemove = makeEnTranslator('removeAdminControl');
const tResend = makeEnTranslator('resendAdminInviteControl');
const tCancel = makeEnTranslator('cancelAdminInviteControl');

const MOCK_VIEWER_ROW = {
  adminId: MOCK_ADMIN_INVITE_ID,
  name: null,
  email: MOCK_ADMIN_EMAIL,
  role: ADMIN_ROLE.SUPERADMIN,
  grantedAt: MOCK_ADMIN_GRANTED_AT,
  isYou: true,
};
const MOCK_OTHER_ROW = {
  adminId: MOCK_LISTED_ADMIN_ID,
  name: MOCK_LISTED_ADMIN_NAME,
  email: MOCK_LISTED_ADMIN_EMAIL,
  role: ADMIN_ROLE.ADMIN,
  grantedAt: MOCK_ADMIN_GRANTED_AT,
  isYou: false,
};
const MOCK_INVITE_ROW = {
  inviteId: MOCK_ADMIN_INVITE_ID,
  email: MOCK_INVITED_ADMIN_EMAIL,
  role: ADMIN_ROLE.SUPERADMIN,
  invitedAt: MOCK_ADMIN_INVITED_AT,
  isExpired: false,
};

const setup = customRender(AdminsView, {
  admins: [MOCK_VIEWER_ROW, MOCK_OTHER_ROW],
  invites: [MOCK_INVITE_ROW],
});

describe(`<${AdminsView.name}/>`, () => {
  describe('with another admin and a pending invite', () => {
    beforeEach(() => {
      setup();
    });

    it('shows each admin with their email and role', () => {
      const row = screen.getByRole('row', {
        name: new RegExp(MOCK_LISTED_ADMIN_NAME),
      });
      const email = within(row).getByText(MOCK_LISTED_ADMIN_EMAIL);
      const role = within(row).getByText(roleLabel.ADMIN);

      expect(email).toBeVisible();
      expect(role).toBeVisible();
    });

    it('offers removal for another admin and never for the viewer', () => {
      const removeOther = screen.getByRole('button', {
        name: tRemove('triggerAriaLabel', { name: MOCK_LISTED_ADMIN_NAME }),
      });
      const removeSelf = screen.queryByRole('button', {
        name: tRemove('triggerAriaLabel', { name: MOCK_ADMIN_EMAIL }),
      });

      expect(removeOther).toBeVisible();
      expect(removeSelf).not.toBeInTheDocument();
    });

    it('shows a pending invite with its role, resend and cancel', () => {
      const row = screen.getByRole('row', {
        name: new RegExp(MOCK_INVITED_ADMIN_EMAIL),
      });
      const role = within(row).getByText(roleLabel.SUPERADMIN);
      const status = within(row).getByText(adminInvitesTable.statusPending);
      const resend = within(row).getByRole('button', {
        name: tResend('triggerAriaLabel', { email: MOCK_INVITED_ADMIN_EMAIL }),
      });
      const cancel = within(row).getByRole('button', {
        name: tCancel('triggerAriaLabel', { email: MOCK_INVITED_ADMIN_EMAIL }),
      });

      expect(role).toBeVisible();
      expect(status).toBeVisible();
      expect(resend).toBeVisible();
      expect(cancel).toBeVisible();
    });

    it('offers the invite form', () => {
      const send = screen.getByRole('button', { name: inviteAdminCard.send });

      expect(send).toBeVisible();
    });
  });

  it('marks an expired invite as expired', () => {
    setup({ invites: [{ ...MOCK_INVITE_ROW, isExpired: true }] });

    const status = screen.getByText(adminInvitesTable.statusExpired);

    expect(status).toBeVisible();
  });

  it('says so when no invite is pending', () => {
    setup({ invites: [] });

    const empty = screen.getByText(adminInvitesTable.empty);

    expect(empty).toBeVisible();
  });
});
