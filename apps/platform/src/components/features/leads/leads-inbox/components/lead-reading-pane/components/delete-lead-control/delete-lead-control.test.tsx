import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import { LEAD_REFUSAL } from '@platform/constants/lead';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { MOCK_LEAD_ID, MOCK_LEAD_NAME } from '@platform/testing/leads/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeleteLeadControl } from './delete-lead-control';

faker.seed(5757);

const { deleteLeadActionMock, onDeletedMock } = vi.hoisted(() => ({
  deleteLeadActionMock: vi.fn(),
  onDeletedMock: vi.fn(),
}));

vi.mock('@platform/server/leads/delete-lead-action', () => ({
  deleteLeadAction: deleteLeadActionMock,
}));

const MOCK_DELETE_TRIGGER = `Delete the message from ${MOCK_LEAD_NAME}`;
const MOCK_CONFIRM_BUTTON = 'Delete message';

const renderControl = () =>
  renderWithIntl(
    <LeadsTenantProvider tenantId={MOCK_TENANT_ID}>
      <DeleteLeadControl
        leadId={MOCK_LEAD_ID}
        leadName={MOCK_LEAD_NAME}
        onDeleted={onDeletedMock}
      />
    </LeadsTenantProvider>,
  );

describe(`<${DeleteLeadControl.name}/>`, () => {
  let user: UserEvent;

  const confirmDelete = async () => {
    const confirmButton = screen.getByRole('button', {
      name: MOCK_CONFIRM_BUTTON,
    });
    await user.click(confirmButton);
  };

  beforeEach(async () => {
    user = userEvent.setup();
    onDeletedMock.mockReset();
    deleteLeadActionMock.mockReset();
    deleteLeadActionMock.mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    renderControl();

    const deleteTrigger = screen.getByRole('button', {
      name: MOCK_DELETE_TRIGGER,
    });
    await user.click(deleteTrigger);
  });

  it('deletes nothing until the owner confirms', async () => {
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Delete this message?',
    });

    expect(dialog).toBeVisible();
    expect(deleteLeadActionMock).not.toHaveBeenCalled();
  });

  it('deletes the lead on confirm, then reports it deleted', async () => {
    await confirmDelete();

    await waitFor(() =>
      expect(onDeletedMock).toHaveBeenCalledWith(MOCK_LEAD_ID),
    );
    expect(deleteLeadActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_LEAD_ID,
    );
  });

  it('keeps the dialog open with an error when the delete fails', async () => {
    deleteLeadActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await confirmDelete();

    const error = await screen.findByText(
      "Couldn't delete the message. Try again.",
    );
    expect(error).toBeVisible();
    expect(onDeletedMock).not.toHaveBeenCalled();
  });

  it('reports a message already deleted elsewhere as deleted', async () => {
    deleteLeadActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: LEAD_REFUSAL.NOT_FOUND,
    });

    await confirmDelete();

    await waitFor(() =>
      expect(onDeletedMock).toHaveBeenCalledWith(MOCK_LEAD_ID),
    );
  });
});
