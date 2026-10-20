import { ACTION_OUTCOME } from '@blog/config';
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
  studioAccess: 'INVITE_SENT',
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
    ['INVITE_SENT', 'Accept your Studio invite'],
    ['ACTIVATING', 'Setting up your Studio access'],
    ['STALLED', "Your Studio invite hasn't been accepted"],
  ] as const)('explains the %s state', (studioAccess, title) => {
    setup({ studioAccess });

    const studioHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Studio',
    });

    expect(studioHeading).toBeVisible();
    const titleElement = screen.getByText(title);

    expect(titleElement).toBeVisible();
  });

  it('offers no resend once the owner has accepted the invite', () => {
    setup({ studioAccess: 'ACTIVATING' });

    const checkNowButton = screen.getByRole('button', { name: 'Check now' });

    expect(checkNowButton).toBeVisible();
    const resendInviteButton = screen.queryByRole('button', {
      name: 'Resend invite',
    });

    expect(resendInviteButton).not.toBeInTheDocument();
  });

  it('checks the access now, confirms it and refreshes the page', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: 'Check now' }));

    expect(checkOwnerAccessActionMock).toHaveBeenCalledWith('tenant-1');
    const checkingYourAccessText = await screen.findByText(
      'Checking your access now. Refresh in a minute to see the result.',
    );

    expect(checkingYourAccessText).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('resends the invite and confirms it', async () => {
    setup({ studioAccess: 'STALLED' });

    await user.click(screen.getByRole('button', { name: 'Resend invite' }));

    expect(resendOwnerInviteActionMock).toHaveBeenCalledWith('tenant-1');
    const aNewInviteText = await screen.findByText(
      'A new invite is on its way to your inbox.',
    );

    expect(aNewInviteText).toBeVisible();
  });

  it('reports a request the worker did not accept', async () => {
    resendOwnerInviteActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    await user.click(screen.getByRole('button', { name: 'Resend invite' }));

    const couldNotReachText = await screen.findByText(
      "Couldn't reach the setup service — try again.",
    );

    expect(couldNotReachText).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });
});
