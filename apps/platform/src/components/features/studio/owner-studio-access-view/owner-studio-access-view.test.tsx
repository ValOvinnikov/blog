import { ACTION_OUTCOME } from '@blog/config';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
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
  tenantId: MOCK_TENANT_ID,
  studioAccess: OWNER_STUDIO_ACCESS.INVITE_SENT,
});

const RESEND_INVITE = 'Resend invite';
const CHECK_NOW = 'Check now';

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

  it.each([
    [OWNER_STUDIO_ACCESS.INVITE_SENT, [CHECK_NOW, RESEND_INVITE]],
    [OWNER_STUDIO_ACCESS.ACTIVATING, [CHECK_NOW]],
    [OWNER_STUDIO_ACCESS.STALLED, [RESEND_INVITE, CHECK_NOW]],
  ] as const)('orders the %s actions', (studioAccess, actionNames) => {
    setup({ studioAccess });

    const buttons = screen.getAllByRole('button');
    const expectedButtons = actionNames.map((name) =>
      screen.getByRole('button', { name }),
    );

    expect(buttons).toEqual(expectedButtons);
  });

  describe('with an invite waiting for the owner', () => {
    beforeEach(() => {
      setup();
    });

    it('checks the access now, confirms it and refreshes the page', async () => {
      const checkNowButton = screen.getByRole('button', { name: CHECK_NOW });
      await user.click(checkNowButton);

      const checkStartedText = await screen.findByText(
        'Checking your access now. Refresh in a minute to see the result.',
      );

      expect(checkOwnerAccessActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(checkStartedText).toBeVisible();
      expect(refresh).toHaveBeenCalledOnce();
    });

    it('resends the invite and confirms it', async () => {
      const resendInviteButton = screen.getByRole('button', {
        name: RESEND_INVITE,
      });
      await user.click(resendInviteButton);

      const inviteResentText = await screen.findByText(
        'A new invite is on its way to your inbox.',
      );

      expect(resendOwnerInviteActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(inviteResentText).toBeVisible();
    });

    it('holds Check now while the resend runs', async () => {
      resendOwnerInviteActionMock.mockReturnValue(new Promise(() => {}));

      const resendInviteButton = screen.getByRole('button', {
        name: RESEND_INVITE,
      });
      await user.click(resendInviteButton);

      const checkNowButton = screen.getByRole('button', { name: CHECK_NOW });

      expect(resendInviteButton).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(checkNowButton).toBeDisabled();
    });

    it('reports a request the worker did not accept', async () => {
      resendOwnerInviteActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      const resendInviteButton = screen.getByRole('button', {
        name: RESEND_INVITE,
      });
      await user.click(resendInviteButton);

      const requestFailedText = await screen.findByText(
        "Couldn't reach the setup service — try again.",
      );

      expect(requestFailedText).toBeVisible();
      expect(refresh).not.toHaveBeenCalled();
    });
  });
});
