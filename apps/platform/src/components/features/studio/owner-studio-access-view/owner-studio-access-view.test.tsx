import { ACTION_OUTCOME } from '@blog/config';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OwnerStudioAccessView } from './owner-studio-access-view';

const { checkOwnerAccessActionMock, resendOwnerInviteActionMock } = vi.hoisted(
  () => ({
    checkOwnerAccessActionMock: vi.fn(),
    resendOwnerInviteActionMock: vi.fn(),
  }),
);

vi.mock('@platform/server/owner-access/check-owner-access-action', () => ({
  checkOwnerAccessAction: checkOwnerAccessActionMock,
}));

vi.mock('@platform/server/owner-access/resend-owner-invite-action', () => ({
  resendOwnerInviteAction: resendOwnerInviteActionMock,
}));

const setup = customRender(OwnerStudioAccessView, {
  tenantId: 'tenant-1',
  studioAccess: OWNER_STUDIO_ACCESS.INVITE_SENT,
});

describe(`<${OwnerStudioAccessView.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    checkOwnerAccessActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    resendOwnerInviteActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it.each([
    [OWNER_STUDIO_ACCESS.INVITE_SENT, 'Accept your Studio invite'],
    [OWNER_STUDIO_ACCESS.ACTIVATING, 'Setting up your Studio access'],
    [OWNER_STUDIO_ACCESS.STALLED, "Your Studio invite hasn't been accepted"],
  ] as const)('explains the %s state', (studioAccess, title) => {
    setup({ studioAccess });

    const studioHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Studio',
    });
    const titleElement = screen.getByText(title);

    expect(studioHeading).toBeVisible();
    expect(titleElement).toBeVisible();
  });

  it('offers no resend once the owner has accepted the invite', () => {
    setup({ studioAccess: OWNER_STUDIO_ACCESS.ACTIVATING });

    const checkNowButton = screen.getByRole('button', { name: 'Check now' });
    const resendInviteButton = screen.queryByRole('button', {
      name: 'Resend invite',
    });

    expect(checkNowButton).toBeVisible();
    expect(resendInviteButton).not.toBeInTheDocument();
  });

  describe('with an invite waiting for the owner', () => {
    beforeEach(() => {
      setup();
    });

    it('checks the access now, confirms it and refreshes the page', async () => {
      await user.click(screen.getByRole('button', { name: 'Check now' }));

      const checkStartedText = await screen.findByText(
        'Checking your access now. Refresh in a minute to see the result.',
      );

      expect(checkOwnerAccessActionMock).toHaveBeenCalledWith('tenant-1');
      expect(checkStartedText).toBeVisible();
      expect(refresh).toHaveBeenCalledOnce();
    });

    it('resends the invite and confirms it', async () => {
      await user.click(screen.getByRole('button', { name: 'Resend invite' }));

      const inviteResentText = await screen.findByText(
        'A new invite is on its way to your inbox.',
      );

      expect(resendOwnerInviteActionMock).toHaveBeenCalledWith('tenant-1');
      expect(inviteResentText).toBeVisible();
    });

    it('reports a request the worker did not accept', async () => {
      resendOwnerInviteActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await user.click(screen.getByRole('button', { name: 'Resend invite' }));

      const requestFailedText = await screen.findByText(
        "Couldn't reach the setup service — try again.",
      );

      expect(requestFailedText).toBeVisible();
      expect(refresh).not.toHaveBeenCalled();
    });
  });
});
