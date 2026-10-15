import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeleteLeadControl } from './delete-lead-control';

const { deleteLeadActionMock } = vi.hoisted(() => ({
  deleteLeadActionMock: vi.fn(),
}));

vi.mock('@platform/server/leads/delete-lead-action', () => ({
  deleteLeadAction: deleteLeadActionMock,
}));

const setup = () =>
  renderWithIntl(
    <LeadsTenantProvider tenantId="tenant-1">
      <DeleteLeadControl leadId="lead-1" leadName="Ada" />
    </LeadsTenantProvider>,
  );

const openDialog = (user: UserEvent) =>
  user.click(
    screen.getByRole('button', { name: 'Delete the message from Ada' }),
  );

describe(`<${DeleteLeadControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    deleteLeadActionMock.mockReset();
    deleteLeadActionMock.mockResolvedValue({ ok: true });
  });

  it('deletes nothing until the owner confirms', async () => {
    setup();

    await openDialog(user);

    expect(
      await screen.findByRole('alertdialog', { name: 'Delete this message?' }),
    ).toBeVisible();
    expect(deleteLeadActionMock).not.toHaveBeenCalled();
  });

  it('deletes the lead on confirm, then refreshes the list', async () => {
    setup();
    await openDialog(user);

    await user.click(screen.getByRole('button', { name: 'Delete message' }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(deleteLeadActionMock).toHaveBeenCalledWith('tenant-1', 'lead-1');
  });

  it('keeps the dialog open with an error when the delete fails', async () => {
    deleteLeadActionMock.mockResolvedValue({ ok: false, reason: 'failed' });
    setup();
    await openDialog(user);

    await user.click(screen.getByRole('button', { name: 'Delete message' }));

    expect(
      await screen.findByText("Couldn't delete the message. Try again."),
    ).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('refreshes a list that still shows a message already deleted elsewhere', async () => {
    deleteLeadActionMock.mockResolvedValue({ ok: false, reason: 'notFound' });
    setup();
    await openDialog(user);

    await user.click(screen.getByRole('button', { name: 'Delete message' }));

    expect(
      await screen.findByText('This message was already deleted.'),
    ).toBeVisible();
    expect(refresh).toHaveBeenCalled();
  });
});
