import { PLATFORM_ADMIN_REFUSAL } from '@platform/constants/platform-admins';
import { resendAdminInviteAction } from '@platform/server/platform-admins/resend-admin-invite-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_ADMIN_INVITE_ID,
  MOCK_INVITED_ADMIN_EMAIL,
} from '@platform/testing/platform-admins/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import { ADMIN_INVITE_LIFETIME_DAYS } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ResendAdminInviteControl } from './resend-admin-invite-control';

vi.mock('@platform/server/platform-admins/resend-admin-invite-action');

const t = makeEnTranslator('resendAdminInviteControl');
const NAMED = { email: MOCK_INVITED_ADMIN_EMAIL };

const setup = customRender(ResendAdminInviteControl, {
  inviteId: MOCK_ADMIN_INVITE_ID,
  email: MOCK_INVITED_ADMIN_EMAIL,
});

describe(`<${ResendAdminInviteControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  const resend = async () => {
    const trigger = screen.getByRole('button', {
      name: t('triggerAriaLabel', NAMED),
    });
    await user.click(trigger);
  };

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    setup();
  });

  it('resends the invite and says how long it now lasts', async () => {
    await resend();

    const toast = await screen.findByText(
      t('done', { ...NAMED, days: ADMIN_INVITE_LIFETIME_DAYS }),
    );

    expect(resendAdminInviteAction).toHaveBeenCalledWith(MOCK_ADMIN_INVITE_ID);
    expect(toast).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each([
    ['already an admin', PLATFORM_ADMIN_REFUSAL.ALREADY_ADMIN, 'alreadyAdmin'],
    ['no longer pending', PLATFORM_ADMIN_REFUSAL.NOT_FOUND, 'gone'],
  ])(
    'says so and refreshes when the address is %s',
    async (_case, reason, key) => {
      vi.mocked(resendAdminInviteAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.REFUSED,
        reason,
      });

      await resend();

      const toast = await screen.findByText(t(key, NAMED));

      expect(toast).toBeVisible();
      expect(refresh).toHaveBeenCalledOnce();
    },
  );

  it('says the resend failed and leaves the list as it is', async () => {
    vi.mocked(resendAdminInviteAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await resend();

    const toast = await screen.findByText(t('failed', NAMED));

    expect(toast).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });
});
