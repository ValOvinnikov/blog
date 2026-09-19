import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import {
  SettingsFormShell,
  type TSettingsFormShellProps,
} from './settings-form-shell';

const baseProps: TSettingsFormShellProps = {
  title: 'Features',
  description: 'Toggle capabilities for this tenant.',
  saveButtonLabel: 'Save changes',
  savingButtonLabel: 'Saving…',
  onSave: vi.fn(),
  isPending: false,
  archivedNoticeId: 'archived-notice',
  hasError: false,
  errorTitle: 'Something went wrong — try again.',
  children: <p>tab body</p>,
};

describe(SettingsFormShell, () => {
  it('renders the title, description and children', () => {
    renderWithIntl(<SettingsFormShell {...baseProps} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Features' }),
    ).toBeVisible();
    expect(
      screen.getByText('Toggle capabilities for this tenant.'),
    ).toBeVisible();
    expect(screen.getByText('tab body')).toBeVisible();
  });

  it('calls onSave when the Save button is clicked', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<SettingsFormShell {...baseProps} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables Save when isSaveDisabled is true', () => {
    renderWithIntl(<SettingsFormShell {...baseProps} isSaveDisabled={true} />);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('shows the saving label and disables Save while pending', () => {
    renderWithIntl(<SettingsFormShell {...baseProps} isPending={true} />);

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });

  it('shows the archived notice and describes the Save button by it when archivedAt is set', () => {
    renderWithIntl(
      <SettingsFormShell
        {...baseProps}
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Save changes' }),
    ).toHaveAccessibleDescription(/This tenant is archived/);
  });

  it('shows no archived notice when archivedAt is unset', () => {
    renderWithIntl(<SettingsFormShell {...baseProps} />);

    expect(
      screen.queryByText('This tenant is archived'),
    ).not.toBeInTheDocument();
  });

  it('shows no error alert when hasError is false', () => {
    renderWithIntl(<SettingsFormShell {...baseProps} />);
    expect(
      screen.queryByText('Something went wrong — try again.'),
    ).not.toBeInTheDocument();
  });

  it('shows the error alert when hasError is true', () => {
    renderWithIntl(<SettingsFormShell {...baseProps} hasError={true} />);
    expect(screen.getByText('Something went wrong — try again.')).toBeVisible();
  });
});
