import { SIZE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRender, screen, within } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ConfirmDialog } from './confirm-dialog';

const OPEN_DIALOG = 'Open dialog';
const CONFIRM_ERROR = 'Something broke.';
const CONFIRMING = 'Confirming…';
const DISABLED_REASON = 'A run is already in progress.';
const ARIA_DISABLED = 'aria-disabled';

type THarnessProps = Omit<
  ComponentProps<typeof ConfirmDialog>,
  'expectedValue' | 'children'
> & {
  disabledReason?: string;
};

const ConfirmDialogHarness = ({ disabledReason, ...props }: THarnessProps) => (
  <ConfirmDialog expectedValue="acme" {...props}>
    <ConfirmDialog.Trigger disabledReason={disabledReason}>
      Open dialog
    </ConfirmDialog.Trigger>
    <ConfirmDialog.Content
      title="Confirm this action"
      description="This cannot be undone."
      confirmButtonLabel="Confirm"
      confirmingButtonLabel="Confirming…"
    >
      <span data-testid="extra">Extra content</span>
    </ConfirmDialog.Content>
  </ConfirmDialog>
);

const onConfirmMock = vi.fn();

const setup = customRender(ConfirmDialogHarness, {
  onConfirm: onConfirmMock,
});

const getConfirmField = () =>
  screen.getByRole('textbox', { name: 'Type "acme" to confirm' });

const getConfirmButton = () =>
  within(screen.getByRole('alertdialog')).getByRole('button', {
    name: 'Confirm',
  });

describe(ConfirmDialog, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    onConfirmMock.mockReset();
    onConfirmMock.mockResolvedValue(okResult());
  });

  it('opens the dialog from the trigger and shows the title, description and extra content', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: OPEN_DIALOG }));

    expect(
      await screen.findByRole('alertdialog', { name: 'Confirm this action' }),
    ).toBeVisible();
    expect(screen.getByText('This cannot be undone.')).toBeVisible();
    expect(screen.getByTestId('extra')).toBeVisible();
  });

  it('names the confirm field after the expected value, with the shared hint', async () => {
    setup();
    await user.click(screen.getByRole('button', { name: OPEN_DIALOG }));

    expect(getConfirmField()).toHaveAccessibleDescription(
      "Must match the tenant's name exactly.",
    );
    expect(getConfirmField()).not.toHaveAttribute('aria-label');
  });

  it('enables confirm only once the typed value matches exactly', async () => {
    setup();
    await user.click(screen.getByRole('button', { name: OPEN_DIALOG }));

    expect(getConfirmButton()).toBeDisabled();

    await user.type(getConfirmField(), 'acm');
    expect(getConfirmButton()).toBeDisabled();

    await user.type(getConfirmField(), 'e');
    expect(getConfirmButton()).toBeEnabled();
  });

  it('calls onConfirm with the typed value, then closes and calls onConfirmed', async () => {
    const onConfirmed = vi.fn();
    setup({ onConfirmed });
    await user.click(screen.getByRole('button', { name: OPEN_DIALOG }));
    await user.type(getConfirmField(), 'acme');

    await user.click(getConfirmButton());

    expect(onConfirmMock).toHaveBeenCalledWith('acme');
    await vi.waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows the server error inline and stays open when onConfirm fails', async () => {
    const onConfirmed = vi.fn();
    onConfirmMock.mockResolvedValue(errorResult(CONFIRM_ERROR));
    setup({ onConfirmed });
    await user.click(screen.getByRole('button', { name: OPEN_DIALOG }));
    await user.type(getConfirmField(), 'acme');

    await user.click(getConfirmButton());

    expect(await screen.findByText(CONFIRM_ERROR)).toBeVisible();
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it('shows and announces the pending label while onConfirm runs', async () => {
    onConfirmMock.mockReturnValue(new Promise(() => {}));
    setup();
    await user.click(screen.getByRole('button', { name: OPEN_DIALOG }));
    await user.type(getConfirmField(), 'acme');

    await user.click(getConfirmButton());

    const pendingButton = await within(
      screen.getByRole('alertdialog'),
    ).findByRole('button', { name: CONFIRMING });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(CONFIRMING);
  });

  it('resets the typed value and the error when closed with cancel, and reports the close', async () => {
    const onOpenChange = vi.fn();
    onConfirmMock.mockResolvedValue(errorResult(CONFIRM_ERROR));
    setup({ onOpenChange });
    await user.click(screen.getByRole('button', { name: OPEN_DIALOG }));
    await user.type(getConfirmField(), 'acme');
    await user.click(getConfirmButton());
    await screen.findByText(CONFIRM_ERROR);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByRole('button', { name: OPEN_DIALOG }));

    expect(getConfirmField()).toHaveValue('');
    expect(screen.queryByText(CONFIRM_ERROR)).not.toBeInTheDocument();
  });

  describe('with a disabled reason', () => {
    beforeEach(() => {
      setup({ disabledReason: DISABLED_REASON });
    });

    it('keeps the trigger focusable but aria-disabled, described by the reason', async () => {
      const trigger = screen.getByRole('button', { name: OPEN_DIALOG });

      expect(trigger).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(trigger).not.toBeDisabled();
      expect(trigger).toHaveAccessibleDescription(DISABLED_REASON);
      expect(screen.getByText(DISABLED_REASON)).toBeVisible();

      await user.tab();
      expect(trigger).toHaveFocus();
    });

    it('never opens the dialog by click or keyboard', async () => {
      const trigger = screen.getByRole('button', { name: OPEN_DIALOG });

      await user.click(trigger);
      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('renders the trigger enabled with no reason when none is given', () => {
    setup();

    const trigger = screen.getByRole('button', { name: OPEN_DIALOG });
    expect(trigger).toBeEnabled();
    expect(trigger).not.toHaveAttribute(ARIA_DISABLED);
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  describe('without an expected value', () => {
    const setupUntyped = () =>
      customRender(
        () => (
          <ConfirmDialog onConfirm={onConfirmMock}>
            <ConfirmDialog.Trigger ariaLabel="Remove the item" size={SIZE.SM}>
              Remove
            </ConfirmDialog.Trigger>
            <ConfirmDialog.Content
              title="Remove this?"
              description="Gone for good."
              confirmButtonLabel="Confirm"
              confirmingButtonLabel="Removing…"
            />
          </ConfirmDialog>
        ),
        {},
      )();

    it('asks for no typed value and confirms straight away', async () => {
      setupUntyped();
      await user.click(screen.getByRole('button', { name: 'Remove the item' }));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(getConfirmButton()).toBeEnabled();

      await user.click(getConfirmButton());

      expect(onConfirmMock).toHaveBeenCalledWith('');
    });
  });
});
