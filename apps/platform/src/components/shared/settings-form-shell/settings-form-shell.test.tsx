import {
  fireEvent,
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';

import {
  SettingsFormShell,
  type TSettingsFormShellProps,
} from './settings-form-shell';

type TValues = { tagline: string; footer: string };

const SAVED: TValues = { tagline: 'Old tagline', footer: 'Old footer' };

const draftFor = (
  values: TValues,
  savedValues: TValues = SAVED,
  onRestore: (values: TValues) => void = vi.fn(),
): TSettingsFormShellProps<TValues>['draft'] => ({
  tenantId: 'tenant-1',
  page: 'voice',
  values,
  savedValues,
  savedAt: new Date('2026-10-08T11:05:00.000Z'),
  fields: [
    { id: 'tagline', label: 'Tagline', display: (v) => v.tagline },
    { id: 'footer', label: 'Footer note', display: (v) => v.footer },
  ],
  onRestore,
});

const baseProps: TSettingsFormShellProps<TValues> = {
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
  draft: draftFor(SAVED),
  children: <p>tab body</p>,
};

const renderShell = (
  overrides: Partial<TSettingsFormShellProps<TValues>> = {},
) => renderWithIntl(<SettingsFormShell {...baseProps} {...overrides} />);

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
    let onSave: TSettingsFormShellProps<TValues>['onSave'];

    beforeEach(() => {
      onSave = vi.fn().mockResolvedValue(true);
      renderShell({ onSave });
    });

    it('shows no save status and offers no save bar', () => {
      expect(screen.queryByText('All changes saved')).not.toBeInTheDocument();
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
    let onSave: TSettingsFormShellProps<TValues>['onSave'];
    let onDiscard: TSettingsFormShellProps<TValues>['onDiscard'];

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

  describe('saved status', () => {
    const TaglineSettings = () => {
      const [saved, setSaved] = useState(SAVED);
      const [values, setValues] = useState(SAVED);

      return (
        <SettingsFormShell
          {...baseProps}
          changeCount={values.tagline === saved.tagline ? 0 : 1}
          onSave={async () => {
            setSaved(values);
            return true;
          }}
          onDiscard={() => setValues(saved)}
          draft={draftFor(values, saved)}
        >
          <label>
            Tagline
            <input
              value={values.tagline}
              onChange={(event) =>
                setValues({ ...values, tagline: event.target.value })
              }
            />
          </label>
        </SettingsFormShell>
      );
    };

    const editTagline = () =>
      user.type(screen.getByRole('textbox', { name: 'Tagline' }), '!');

    it('shows after a successful save', async () => {
      renderWithIntl(<TaglineSettings />);

      await editTagline();
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText('All changes saved')).toBeVisible();
    });

    it('disappears on the next edit after a save', async () => {
      renderWithIntl(<TaglineSettings />);
      await editTagline();
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await screen.findByText('All changes saved');

      await editTagline();

      expect(screen.queryByText('All changes saved')).not.toBeInTheDocument();
    });

    it('stays hidden after discarding back to clean', async () => {
      renderWithIntl(<TaglineSettings />);
      await editTagline();
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await screen.findByText('All changes saved');
      await editTagline();

      await user.click(screen.getByRole('button', { name: 'Discard' }));

      expect(
        screen.queryByRole('region', { name: 'Unsaved changes' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('All changes saved')).not.toBeInTheDocument();
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

  describe('draft recovery', () => {
    const EDITED: TValues = { ...SAVED, tagline: 'My tagline' };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const leaveWithUnsavedChanges = (values: TValues = EDITED) => {
      const { unmount } = renderShell({
        changeCount: 1,
        draft: draftFor(values),
      });
      unmount();
    };

    const queryBanner = () =>
      screen.queryByText(/You have unsaved changes from/);

    it('offers no draft on a first visit', () => {
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('offers to restore exactly the unsaved changes on return', async () => {
      const onRestore = vi.fn();
      leaveWithUnsavedChanges();

      renderShell({ draft: draftFor(SAVED, SAVED, onRestore) });

      expect(queryBanner()).toBeVisible();
      expect(
        screen.getByText(
          'They were kept on this device when you left the page.',
        ),
      ).toBeVisible();
      await user.click(
        screen.getByRole('button', { name: 'Restore 1 change' }),
      );

      expect(onRestore).toHaveBeenCalledWith(EDITED);
      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('forgets the draft when it is discarded from the banner', async () => {
      leaveWithUnsavedChanges();
      const { unmount } = renderShell();

      await user.click(screen.getByRole('button', { name: 'Discard them' }));
      expect(queryBanner()).not.toBeInTheDocument();
      unmount();
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('forgets the draft once the changes are saved', async () => {
      const { unmount } = renderShell({
        changeCount: 1,
        draft: draftFor(EDITED),
      });

      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await waitFor(() => expect(baseProps.onSave).toHaveBeenCalled());
      unmount();
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('forgets the draft once the changes are discarded', async () => {
      const { unmount } = renderShell({
        changeCount: 1,
        draft: draftFor(EDITED),
      });

      await user.click(screen.getByRole('button', { name: 'Discard' }));
      unmount();
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('offers nothing when the draft matches what is saved now', () => {
      leaveWithUnsavedChanges();

      renderShell({ draft: draftFor(EDITED, EDITED) });

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('keeps drafts apart per tenant', () => {
      leaveWithUnsavedChanges();

      renderShell({ draft: { ...draftFor(SAVED), tenantId: 'tenant-2' } });

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('keeps drafts apart per language', () => {
      leaveWithUnsavedChanges();

      renderShell({ draft: { ...draftFor(SAVED), language: 'DE' } });

      expect(queryBanner()).not.toBeInTheDocument();
    });

    it('still works as a form when storage is blocked', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const onSave = vi.fn().mockResolvedValue(true);
      const { unmount } = renderShell({
        onSave,
        changeCount: 1,
        draft: draftFor(EDITED),
      });

      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      expect(onSave).toHaveBeenCalledTimes(1);
      unmount();
      renderShell();

      expect(queryBanner()).not.toBeInTheDocument();
    });

    describe('when someone else saved since', () => {
      const THEIRS: TValues = { ...SAVED, tagline: 'Their tagline' };
      let onRestore: (values: TValues) => void;

      beforeEach(() => {
        onRestore = vi.fn();
        leaveWithUnsavedChanges();
        renderShell({ draft: draftFor(THEIRS, THEIRS, onRestore) });
      });

      it('says the page was saved after the draft was taken', () => {
        expect(screen.getByText(/but this page was saved at/)).toBeVisible();
      });

      it('names the fields a restore would overwrite before any restore', () => {
        expect(
          screen.getByText(
            'Restoring replaces 1 of the newer values: Tagline.',
          ),
        ).toBeVisible();
        expect(
          screen.queryByRole('button', { name: 'Restore 1 change' }),
        ).not.toBeInTheDocument();
        expect(onRestore).not.toHaveBeenCalled();
      });

      it('shows the saved value beside the draft for each differing field', async () => {
        await user.click(screen.getByText('Review the difference'));

        const row = screen.getByRole('row', { name: /Tagline/ });
        expect(
          within(row).getByRole('cell', { name: 'Their tagline' }),
        ).toBeVisible();
        expect(
          within(row).getByRole('cell', { name: 'My tagline' }),
        ).toBeVisible();
      });

      it('restores the draft on Restore anyway', async () => {
        await user.click(
          screen.getByRole('button', { name: 'Restore anyway' }),
        );

        expect(onRestore).toHaveBeenCalledWith(EDITED);
      });

      it('forgets the draft on Discard my draft', async () => {
        await user.click(
          screen.getByRole('button', { name: 'Discard my draft' }),
        );

        expect(queryBanner()).not.toBeInTheDocument();
        expect(onRestore).not.toHaveBeenCalled();
      });
    });
  });
});
