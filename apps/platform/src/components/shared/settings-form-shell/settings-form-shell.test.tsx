import {
  fireEvent,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  SettingsFormShell,
  type TSettingsFormShellProps,
} from './settings-form-shell';

const baseProps: TSettingsFormShellProps = {
  title: 'Features',
  description: 'Toggle capabilities for this tenant.',
  saveButtonLabel: 'Save changes',
  savingButtonLabel: 'Saving…',
  onSave: vi.fn().mockResolvedValue(true),
  onDiscard: vi.fn(),
  changeCount: 0,
  isPending: false,
  archivedNoticeId: 'archived-notice',
  hasError: false,
  errorTitle: 'Something went wrong — try again.',
  children: <p>tab body</p>,
};

const renderShell = (overrides: Partial<TSettingsFormShellProps> = {}) =>
  renderWithIntl(<SettingsFormShell {...baseProps} {...overrides} />);

const dispatchBeforeUnload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe(`<${SettingsFormShell.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the title, description and children', () => {
    renderShell();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Features' }),
    ).toBeVisible();
    expect(
      screen.getByText('Toggle capabilities for this tenant.'),
    ).toBeVisible();
    expect(screen.getByText('tab body')).toBeVisible();
  });

  describe('with no unsaved changes', () => {
    let onSave: TSettingsFormShellProps['onSave'];

    beforeEach(() => {
      onSave = vi.fn().mockResolvedValue(true);
      renderShell({ onSave });
    });

    it('says all changes are saved and offers no save bar', () => {
      expect(screen.getByText('All changes saved')).toBeVisible();
      expect(
        screen.queryByRole('region', { name: 'Unsaved changes' }),
      ).not.toBeInTheDocument();
    });

    it('ignores the save shortcut', async () => {
      await user.keyboard('{Control>}s{/Control}');

      expect(onSave).not.toHaveBeenCalled();
    });

    it('lets the page unload without a warning', () => {
      expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });
  });

  describe('with unsaved changes', () => {
    let onSave: TSettingsFormShellProps['onSave'];
    let onDiscard: TSettingsFormShellProps['onDiscard'];

    beforeEach(() => {
      onSave = vi.fn().mockResolvedValue(true);
      onDiscard = vi.fn();
      renderShell({ onSave, onDiscard, changeCount: 3 });
    });

    it('shows the save bar with the change count in place of the saved status', () => {
      expect(
        screen.getByRole('region', { name: 'Unsaved changes' }),
      ).toHaveTextContent('3 unsaved changes');
      expect(screen.queryByText('All changes saved')).not.toBeInTheDocument();
    });

    it('announces the change count politely', () => {
      const announcement = screen.getByTestId('unsaved-changes-announcement');

      expect(announcement).toHaveAttribute('role', 'status');
      expect(announcement).toHaveTextContent('3 unsaved changes');
    });

    it('calls onSave from the Save button', async () => {
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('calls onDiscard from the Discard button', async () => {
      await user.click(screen.getByRole('button', { name: 'Discard' }));

      expect(onDiscard).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['Ctrl+S', '{Control>}s{/Control}'],
      ['⌘S', '{Meta>}s{/Meta}'],
    ])('saves on %s', async (_, keys) => {
      await user.keyboard(keys);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('warns before the page unloads', () => {
      expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
    });

    it('never moves focus into the save bar', () => {
      expect(document.body).toHaveFocus();
    });
  });

  it('does not save from the shortcut while a save is pending', () => {
    const onSave = vi.fn().mockResolvedValue(true);
    renderShell({ onSave, changeCount: 1, isPending: true });

    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows the archived notice when archivedAt is set', () => {
    renderShell({ archivedAt: new Date('2026-08-26T00:00:00.000Z') });

    expect(screen.getByText('This tenant is archived')).toBeVisible();
  });

  it('shows no archived notice when archivedAt is unset', () => {
    renderShell();

    expect(
      screen.queryByText('This tenant is archived'),
    ).not.toBeInTheDocument();
  });

  it('shows no error alert when hasError is false', () => {
    renderShell();

    expect(
      screen.queryByText('Something went wrong — try again.'),
    ).not.toBeInTheDocument();
  });

  it('shows the error alert when hasError is true', () => {
    renderShell({ hasError: true });

    expect(screen.getByText('Something went wrong — try again.')).toBeVisible();
  });
});
