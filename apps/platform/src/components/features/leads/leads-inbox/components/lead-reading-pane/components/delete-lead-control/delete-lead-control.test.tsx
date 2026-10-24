import { ACTION_OUTCOME } from '@blog/config';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import { LEAD_REFUSAL } from '@platform/constants/lead';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeleteLeadControl } from './delete-lead-control';

const { deleteLeadActionMock, onDeletedMock } = vi.hoisted(() => ({
  deleteLeadActionMock: vi.fn(),
  onDeletedMock: vi.fn(),
}));

vi.mock('@platform/server/leads/delete-lead-action', () => ({
  deleteLeadAction: deleteLeadActionMock,
}));

const LEAD_ID = 'lead-1';

const setup = () =>
  renderWithIntl(
    <LeadsTenantProvider tenantId={MOCK_TENANT_ID}>
      <DeleteLeadControl
        leadId={LEAD_ID}
        leadName="Ada"
        onDeleted={onDeletedMock}
      />
    </LeadsTenantProvider>,
  );

const openDialog = (user: UserEvent) =>
  user.click(
    screen.getByRole('button', { name: 'Delete the message from Ada' }),
  );

const DELETE_MESSAGE = 'Delete message';

describe(`<${DeleteLeadControl.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    onDeletedMock.mockReset();
    deleteLeadActionMock.mockReset();
    deleteLeadActionMock.mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('deletes nothing until the owner confirms', async () => {
    setup();

    await openDialog(user);

    expect(
      await screen.findByRole('alertdialog', { name: 'Delete this message?' }),
    ).toBeVisible();
    expect(deleteLeadActionMock).not.toHaveBeenCalled();
  });

  it('deletes the lead on confirm, then reports it deleted', async () => {
    setup();
    await openDialog(user);

    await user.click(screen.getByRole('button', { name: DELETE_MESSAGE }));

    await waitFor(() => expect(onDeletedMock).toHaveBeenCalledWith(LEAD_ID));
    expect(deleteLeadActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, LEAD_ID);
  });

  it('keeps the dialog open with an error when the delete fails', async () => {
    deleteLeadActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();
    await openDialog(user);

    await user.click(screen.getByRole('button', { name: DELETE_MESSAGE }));

    expect(
      await screen.findByText("Couldn't delete the message. Try again."),
    ).toBeVisible();
    expect(onDeletedMock).not.toHaveBeenCalled();
  });

  it('reports a message already deleted elsewhere as deleted', async () => {
    deleteLeadActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: LEAD_REFUSAL.NOT_FOUND,
    });
    setup();
    await openDialog(user);

    await user.click(screen.getByRole('button', { name: DELETE_MESSAGE }));

    await waitFor(() => expect(onDeletedMock).toHaveBeenCalledWith(LEAD_ID));
  });
});
