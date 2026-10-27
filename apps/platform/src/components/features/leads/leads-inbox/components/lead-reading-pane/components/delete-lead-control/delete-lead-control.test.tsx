import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import { LEAD_REFUSAL } from '@platform/constants/lead';
import messages from '@platform/i18n/messages/en.json';
import { deleteLeadAction } from '@platform/server/leads/delete-lead-action';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_LEAD_ID, MOCK_LEAD_NAME } from '@platform/testing/leads/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeleteLeadControl } from './delete-lead-control';

faker.seed(5757);

vi.mock('@platform/server/leads/delete-lead-action');

const { deleteLeadControl } = messages;
const t = makeEnTranslator('deleteLeadControl');

const onDeleted = vi.fn();

const renderControl = () =>
  renderWithIntl(
    <LeadsTenantProvider tenantId={MOCK_TENANT_ID}>
      <DeleteLeadControl
        leadId={MOCK_LEAD_ID}
        leadName={MOCK_LEAD_NAME}
        onDeleted={onDeleted}
      />
    </LeadsTenantProvider>,
  );

describe(`<${DeleteLeadControl.name}/>`, () => {
  let user: UserEvent;

  const confirmDelete = async () => {
    const confirmButton = screen.getByRole('button', {
      name: deleteLeadControl.confirmButton,
    });
    await user.click(confirmButton);
  };

  beforeEach(async () => {
    user = userEvent.setup();
    vi.mocked(deleteLeadAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    renderControl();

    const deleteTrigger = screen.getByRole('button', {
      name: t('triggerAriaLabel', { name: MOCK_LEAD_NAME }),
    });
    await user.click(deleteTrigger);
  });

  it('deletes nothing until the owner confirms', async () => {
    const dialog = await screen.findByRole('alertdialog', {
      name: deleteLeadControl.dialogTitle,
    });

    expect(dialog).toBeVisible();
    expect(deleteLeadAction).not.toHaveBeenCalled();
  });

  it('deletes the lead on confirm, then reports it deleted', async () => {
    await confirmDelete();

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(MOCK_LEAD_ID));
    expect(deleteLeadAction).toHaveBeenCalledWith(MOCK_TENANT_ID, MOCK_LEAD_ID);
  });

  it('keeps the dialog open with an error when the delete fails', async () => {
    vi.mocked(deleteLeadAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await confirmDelete();

    const error = await screen.findByText(deleteLeadControl.errors.failed);
    const dialog = screen.getByRole('alertdialog', {
      name: deleteLeadControl.dialogTitle,
    });

    expect(error).toBeVisible();
    expect(dialog).toBeVisible();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('reports a message already deleted elsewhere as deleted', async () => {
    vi.mocked(deleteLeadAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: LEAD_REFUSAL.NOT_FOUND,
    });

    await confirmDelete();

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(MOCK_LEAD_ID));
  });
});
