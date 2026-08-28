import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { ConfirmDialog, type TConfirmDialogProps } from './confirm-dialog';

const baseProps: Omit<
  TConfirmDialogProps,
  'isOpen' | 'onOpenChange' | 'confirmValue' | 'onConfirmValueChange'
> = {
  triggerLabel: 'Open dialog',
  title: 'Confirm this action',
  description: 'This cannot be undone.',
  confirmFieldId: 'confirm-field',
  confirmLabel: 'Type "acme" to confirm',
  confirmHint: 'This action is irreversible.',
  expectedValue: 'acme',
  onConfirm: vi.fn(),
  isPending: false,
  confirmButtonLabel: 'Confirm',
  confirmingButtonLabel: 'Confirming…',
  cancelLabel: 'Cancel',
};

const ControlledConfirmDialog = (props: Partial<TConfirmDialogProps> = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');

  return (
    <ConfirmDialog
      {...baseProps}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      confirmValue={confirmValue}
      onConfirmValueChange={setConfirmValue}
      {...props}
    />
  );
};

describe(ConfirmDialog, () => {
  it('opens the dialog from the trigger and shows the title and description', async () => {
    const user = userEvent.setup();
    render(<ControlledConfirmDialog />);

    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    expect(
      await screen.findByRole('alertdialog', {
        name: 'Confirm this action',
      }),
    ).toBeVisible();
    expect(screen.getByText('This cannot be undone.')).toBeVisible();
  });

  it('disables the confirm button until the typed value matches expectedValue', async () => {
    const user = userEvent.setup();
    render(<ControlledConfirmDialog />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();

    await user.type(
      screen.getByRole('textbox', { name: 'Type "acme" to confirm' }),
      'acme',
    );

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ControlledConfirmDialog onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Type "acme" to confirm' }),
      'acme',
    );

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes the dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ControlledConfirmDialog />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await screen.findByRole('alertdialog');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows the error message when provided', async () => {
    const user = userEvent.setup();
    render(<ControlledConfirmDialog error="Something went wrong." />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    expect(await screen.findByText('Something went wrong.')).toBeVisible();
  });

  it('disables the confirm button and shows the pending label while isPending', async () => {
    const user = userEvent.setup();
    render(<ControlledConfirmDialog isPending={true} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Type "acme" to confirm' }),
      'acme',
    );

    expect(screen.getByRole('button', { name: 'Confirming…' })).toBeDisabled();
  });

  it('renders extra content passed as children between the field and the actions', async () => {
    const user = userEvent.setup();
    render(
      <ControlledConfirmDialog>
        <span data-testid="extra">Extra content</span>
      </ControlledConfirmDialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    expect(await screen.findByTestId('extra')).toBeVisible();
  });
});
