import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailSettingsForm } from './email-settings-form';

const render = renderWithIntl;

const { updateEmailConfigActionMock } = vi.hoisted(() => ({
  updateEmailConfigActionMock: vi.fn(),
}));

vi.mock('@platform/server/email-config/update-email-config-action', () => ({
  updateEmailConfigAction: updateEmailConfigActionMock,
}));

vi.mock('@platform/server/email/upload-email-logo-action', () => ({
  uploadEmailLogoAction: vi.fn(),
}));

vi.mock('@platform/server/email/clear-email-logo-action', () => ({
  clearEmailLogoAction: vi.fn(),
}));

const INITIAL_VALUES = {
  senderName: 'Acme Co',
  replyToAddress: 'support@acme.example',
  footerPostalAddress: '123 Main St',
  logoAssetUrl: undefined,
};

describe(EmailSettingsForm, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    updateEmailConfigActionMock.mockReset();
    updateEmailConfigActionMock.mockResolvedValue({ ok: true });
  });

  describe('with the saved initial values', () => {
    beforeEach(() => {
      render(
        <EmailSettingsForm
          tenantId="tenant-1"
          initialValues={INITIAL_VALUES}
        />,
      );
    });

    it('renders the given initial values', () => {
      expect(screen.getByDisplayValue('Acme Co')).toBeVisible();
      expect(screen.getByDisplayValue('support@acme.example')).toBeVisible();
      expect(screen.getByDisplayValue('123 Main St')).toBeVisible();
    });

    it('saves edited fields as-is', async () => {
      const senderNameInput = screen.getByDisplayValue('Acme Co');
      await user.clear(senderNameInput);
      await user.type(senderNameInput, 'New Name');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateEmailConfigActionMock).toHaveBeenCalledWith('tenant-1', {
          senderName: 'New Name',
          replyToAddress: 'support@acme.example',
          footerPostalAddress: '123 Main St',
        });
      });
    });

    it('sends null, not an empty string, when a field is cleared', async () => {
      await user.clear(screen.getByDisplayValue('Acme Co'));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateEmailConfigActionMock).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({ senderName: null }),
        );
      });
    });

    it('shows a spinner, marks Save busy, and announces the pending state to assistive tech while the save is in flight', async () => {
      let resolveAction: (value: { ok: boolean }) => void = () => {};
      updateEmailConfigActionMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve;
          }),
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      const saveButton = await screen.findByRole('button', { name: 'Saving…' });
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('status')).toHaveTextContent('Saving…');

      resolveAction({ ok: true });
    });

    it('shows an error alert when the save fails', async () => {
      updateEmailConfigActionMock.mockResolvedValue({ ok: false });
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "Couldn't save email settings",
      );
    });
  });

  it('disables Save while the tenant is archived', () => {
    render(
      <EmailSettingsForm
        tenantId="tenant-1"
        initialValues={INITIAL_VALUES}
        isArchived={true}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });
});
